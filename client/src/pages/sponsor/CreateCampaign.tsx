import { SponsorSidebar } from "@/components/SponsorSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { api, formatINR } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { TIERS, getPaymentByStyle, calculateSponsorPayment, TAX_RATES, formatTierRange } from "@shared/tiers";
import { PROMOTION_CATEGORIES } from "@shared/schema";
import { Upload, X, FileCheck, Loader2, Users, Trash2, AlertTriangle, CheckCircle, Wallet, Calendar, Tag, Globe } from "lucide-react";
import { COUNTRIES, getCountryByCode } from "@shared/countries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const CONTENT_TYPES = [
  { id: "reel", label: "Reel", icon: "🎬" },
  { id: "story", label: "Story", icon: "📱" },
  { id: "post", label: "Post", icon: "📷" },
  { id: "carousel", label: "Carousel", icon: "🎠" },
];

const PROMOTION_STYLES = [
  { 
    id: "lyricals", 
    label: "Lyricals / Page Promotion", 
    icon: "🎵",
    description: "Creator uses provided content/audio only"
  },
  { 
    id: "face_ad", 
    label: "Face on Camera", 
    icon: "🎥",
    description: "Creator appears in video for the ad"
  },
  { 
    id: "share_only", 
    label: "Direct Share", 
    icon: "📤",
    description: "Creator shares sponsor's provided file"
  },
];

interface TierSelection {
  tierName: string;
  tierId: number;
  creatorsNeeded: number;
  paymentPerCreator: number;
  minFollowers: number;
  maxFollowers: number;
}

export default function CreateCampaign() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: sponsor } = useQuery({
    queryKey: ["currentSponsor"],
    queryFn: api.getCurrentSponsor,
  });

  const { data: wallet } = useQuery({
    queryKey: ["sponsorWallet", sponsor?.id],
    queryFn: () => sponsor ? api.getSponsorWallet(sponsor.id) : null,
    enabled: !!sponsor,
  });

  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    brandLogo: "",
    brandLogoFileName: "",
    category: "music_reels",
    types: [] as string[],
    promotionStyle: "",
    description: "",
    deadline: "",
    assetUrl: "",
    assetFileName: "",
    targetCountries: ["IN"] as string[],
  });

  const [tierSelections, setTierSelections] = useState<TierSelection[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percent);
      }
    });
    
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          setFormData(prev => ({
            ...prev,
            assetUrl: data.url,
            assetFileName: data.fileName,
          }));
          toast.success("File uploaded successfully!");
        } catch {
          toast.error("Failed to parse upload response");
        }
      } else {
        toast.error("Upload failed");
      }
      setIsUploading(false);
      setUploadProgress(0);
    });
    
    xhr.addEventListener("error", () => {
      toast.error("Failed to upload file");
      setIsUploading(false);
      setUploadProgress(0);
    });
    
    xhr.open("POST", "/api/upload");
    xhr.send(formDataUpload);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, assetUrl: "", assetFileName: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    setIsUploadingLogo(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          brandLogo: data.url,
          brandLogoFileName: data.fileName,
        }));
        toast.success("Brand logo uploaded!");
      } else {
        toast.error("Failed to upload logo");
      }
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoUpload(file);
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, brandLogo: "", brandLogoFileName: "" }));
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const toggleTier = (tier: typeof TIERS[0]) => {
    const exists = tierSelections.find(t => t.tierName === tier.name);
    if (exists) {
      setTierSelections(prev => prev.filter(t => t.tierName !== tier.name));
    } else {
      const payment = formData.promotionStyle 
        ? getPaymentByStyle(tier.basePayment, formData.promotionStyle)
        : tier.basePayment;
      setTierSelections(prev => [...prev, {
        tierName: tier.name,
        tierId: tier.id,
        creatorsNeeded: 1,
        paymentPerCreator: payment,
        minFollowers: tier.minFollowers,
        maxFollowers: tier.maxFollowers,
      }]);
    }
  };

  const updateTierCreators = (tierName: string, count: number) => {
    setTierSelections(prev => prev.map(t => 
      t.tierName === tierName ? { ...t, creatorsNeeded: Math.max(1, count) } : t
    ));
  };

  const removeTierSelection = (tierName: string) => {
    setTierSelections(prev => prev.filter(t => t.tierName !== tierName));
  };

  const updatePaymentsForStyle = (style: string) => {
    setTierSelections(prev => prev.map(t => {
      const tier = TIERS.find(tier => tier.name === t.tierName);
      if (!tier) return t;
      return {
        ...t,
        paymentPerCreator: getPaymentByStyle(tier.basePayment, style),
      };
    }));
  };

  const getCreatorPaymentTotal = () => {
    return tierSelections.reduce((sum, t) => sum + (t.paymentPerCreator * t.creatorsNeeded), 0);
  };

  const getTotalCreators = () => {
    return tierSelections.reduce((sum, t) => sum + t.creatorsNeeded, 0);
  };

  const walletBalance = parseFloat(wallet?.balance || sponsor?.balance || "0");
  const creatorPaymentTotal = getCreatorPaymentTotal();
  const paymentBreakdown = calculateSponsorPayment(creatorPaymentTotal);
  const totalPayable = paymentBreakdown.totalPayable;
  const hasInsufficientBalance = totalPayable > walletBalance;

  const validateForm = () => {
    if (!formData.title || !formData.brand || !formData.deadline) {
      toast.error("Please fill all required fields");
      return false;
    }
    if (formData.types.length === 0) {
      toast.error("Please select at least one content type");
      return false;
    }
    if (!formData.promotionStyle) {
      toast.error("Please select a promotion style");
      return false;
    }
    if (tierSelections.length === 0) {
      toast.error("Please add at least one tier with creators");
      return false;
    }
    return true;
  };

  const handleReviewClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmCreate = async () => {
    if (!sponsor) {
      toast.error("Sponsor not found");
      return;
    }

    if (hasInsufficientBalance) {
      toast.error("Insufficient wallet balance. Please add funds first.");
      setShowConfirmDialog(false);
      navigate("/sponsor/wallet");
      return;
    }

    setIsCreating(true);
    const typeLabel = formData.types.map(t => CONTENT_TYPES.find(ct => ct.id === t)?.label).filter(Boolean).join(", ");

    try {
      for (const tierSelection of tierSelections) {
        await api.createCampaign(sponsor.id, {
          title: `${formData.title} (${tierSelection.tierName})`,
          brand: formData.brand,
          brandLogo: formData.brandLogo,
          category: formData.category,
          payAmount: tierSelection.paymentPerCreator.toString(),
          type: typeLabel || "Reel",
          contentTypes: formData.types,
          promotionStyle: formData.promotionStyle,
          assetUrl: formData.assetUrl || null,
          assetFileName: formData.assetFileName || null,
          tier: tierSelection.tierName,
          description: formData.description,
          deadline: formData.deadline,
          minFollowers: tierSelection.minFollowers,
          totalSpots: tierSelection.creatorsNeeded,
          targetCountries: formData.targetCountries,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["sponsorCampaigns"] });
      queryClient.invalidateQueries({ queryKey: ["sponsorWallet"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success(`${tierSelections.length} campaign(s) created successfully!`);
      setShowConfirmDialog(false);
      navigate("/sponsor/campaigns");
    } catch (error: any) {
      toast.error(error.message || "Failed to create campaign");
    } finally {
      setIsCreating(false);
    }
  };

  const getPromotionStyleLabel = () => {
    return PROMOTION_STYLES.find(s => s.id === formData.promotionStyle)?.label || "";
  };

  const getCategoryLabel = () => {
    return PROMOTION_CATEGORIES.find(c => c.id === formData.category)?.name || "";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SponsorSidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="mx-auto max-w-3xl p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>
            <p className="text-muted-foreground">List a new influencer marketing campaign</p>
          </div>

          <form onSubmit={handleReviewClick}>
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Campaign Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Summer Fashion Reel"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      data-testid="input-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand Name *</Label>
                    <Input
                      id="brand"
                      placeholder="e.g., Myntra"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      data-testid="input-brand"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Brand Logo (Optional)</Label>
                  <div className="flex items-center gap-4">
                    {formData.brandLogo ? (
                      <div className="relative">
                        <img 
                          src={formData.brandLogo} 
                          alt="Brand logo" 
                          className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
                          data-testid="button-remove-logo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                        {formData.brand ? formData.brand.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        ref={logoInputRef}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        data-testid="button-upload-logo"
                      >
                        {isUploadingLogo ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                        ) : (
                          <><Upload className="h-4 w-4 mr-2" /> Upload Logo</>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload your brand logo. If not uploaded, first letter of brand name will be shown.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target Countries *</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.targetCountries.map((code) => {
                      const country = COUNTRIES.find(c => c.code === code);
                      if (!country) return null;
                      return (
                        <Badge 
                          key={code} 
                          variant="secondary" 
                          className="flex items-center gap-1"
                        >
                          {country.flag} {country.name}
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              targetCountries: formData.targetCountries.filter(c => c !== code)
                            })}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                  <Select 
                    value=""
                    onValueChange={(value) => {
                      if (value && !formData.targetCountries.includes(value)) {
                        setFormData({ 
                          ...formData, 
                          targetCountries: [...formData.targetCountries, value] 
                        });
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-target-country">
                      <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Add countries to target..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {COUNTRIES.filter(c => !formData.targetCountries.includes(c.code)).map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.currencySymbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select one or more countries. Only creators from selected countries will see your campaign.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Campaign Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what creators need to do..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    data-testid="input-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Promotion Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROMOTION_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {PROMOTION_CATEGORIES.find(c => c.id === formData.category)?.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Content Type *</Label>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {CONTENT_TYPES.map((type) => {
                      const isChecked = formData.types.includes(type.id);
                      return (
                        <label
                          key={type.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                            isChecked
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-muted-foreground/50"
                          }`}
                          data-testid={`checkbox-${type.id}`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({ ...prev, types: [...prev.types, type.id] }));
                              } else {
                                setFormData(prev => ({ ...prev, types: prev.types.filter(t => t !== type.id) }));
                              }
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{type.icon}</span>
                            <span className="text-sm font-medium">{type.label}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Promotion Style *</Label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {PROMOTION_STYLES.map((style) => {
                      const isSelected = formData.promotionStyle === style.id;
                      return (
                        <label
                          key={style.id}
                          className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-muted-foreground/50"
                          }`}
                          data-testid={`promo-${style.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="promotionStyle"
                              value={style.id}
                              checked={isSelected}
                              onChange={() => {
                                setFormData({ ...formData, promotionStyle: style.id });
                                updatePaymentsForStyle(style.id);
                              }}
                              className="h-4 w-4 accent-primary"
                            />
                            <span className="text-xl">{style.icon}</span>
                            <span className="font-medium">{style.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground pl-7">{style.description}</p>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Select Tiers & Number of Creators *</Label>
                  <p className="text-sm text-muted-foreground">Click on tiers to add them, then specify how many creators you need for each</p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {TIERS.map((tier) => {
                      const isSelected = tierSelections.some(t => t.tierName === tier.name);
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => toggleTier(tier)}
                          className={`flex flex-col items-center justify-center rounded-lg border-2 p-2 text-center transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted hover:border-muted-foreground/50"
                          }`}
                          data-testid={`tier-${tier.id}`}
                        >
                          <div className="font-semibold text-sm">{tier.name.replace("Tier ", "T")}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatTierRange(tier.minFollowers, tier.maxFollowers)}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {tierSelections.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <Label className="text-sm">Selected Tiers - Set Creators Count</Label>
                      <div className="space-y-2">
                        {tierSelections
                          .sort((a, b) => a.tierId - b.tierId)
                          .map((selection) => (
                          <div 
                            key={selection.tierName}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                            data-testid={`tier-selection-${selection.tierId}`}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{selection.tierName}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatTierRange(selection.minFollowers, selection.maxFollowers)} followers | {formatINR(selection.paymentPerCreator)}/creator
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                min="1"
                                className="w-20"
                                value={selection.creatorsNeeded}
                                onChange={(e) => updateTierCreators(selection.tierName, parseInt(e.target.value) || 1)}
                                data-testid={`input-creators-${selection.tierId}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTierSelection(selection.tierName)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    data-testid="input-deadline"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Upload Content for Creators (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload audio, video, images, or any file that creators need for this campaign
                  </p>
                  
                  {!formData.assetUrl ? (
                    <div 
                      className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="upload-dropzone"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="audio/*,video/*,image/*,.pdf,.zip,.mp3,.mp4,.mov,.wav"
                        data-testid="input-file"
                      />
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-3 w-full px-6">
                          <Loader2 className="h-10 w-10 text-primary animate-spin" />
                          <div className="w-full max-w-xs">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Uploading...</span>
                              <span className="font-medium text-primary">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-4">
                            <Upload className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Click to upload file</p>
                            <p className="text-sm text-muted-foreground">Audio, Video, Images, PDF (Max 50MB)</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border-2 border-green-200 bg-green-50 dark:bg-green-900/20 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-100 dark:bg-green-800 p-2">
                          <FileCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-300">{formData.assetFileName}</p>
                          <p className="text-xs text-green-600">File uploaded successfully</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid="button-remove-file"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {tierSelections.length > 0 && (
                  <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">Payment Summary</h3>
                    <div className="space-y-3">
                      {tierSelections
                        .sort((a, b) => a.tierId - b.tierId)
                        .map((selection) => (
                        <div key={selection.tierName} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {selection.tierName} ({selection.creatorsNeeded} creators)
                          </span>
                          <span className="font-medium">
                            {formatINR(selection.paymentPerCreator * selection.creatorsNeeded)}
                          </span>
                        </div>
                      ))}
                      
                      <div className="border-t pt-3 mt-3 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Creator Payments Subtotal</span>
                          <span className="font-medium">{formatINR(paymentBreakdown.creatorPayment)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Platform Fee ({TAX_RATES.PLATFORM_FEE_PERCENT}%)</span>
                          <span className="font-medium">{formatINR(paymentBreakdown.platformFee)}</span>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Total Payable ({getTotalCreators()} creators)
                          </span>
                          <span className="text-2xl font-bold text-green-600" data-testid="total-payment">
                            {formatINR(totalPayable)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed">
                          <span className="text-sm flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            Wallet Balance
                          </span>
                          <span className={`font-semibold ${hasInsufficientBalance ? "text-red-500" : "text-green-600"}`}>
                            {formatINR(walletBalance)}
                          </span>
                        </div>
                        {hasInsufficientBalance && (
                          <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Insufficient balance! Need {formatINR(totalPayable - walletBalance)} more
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 rounded-full"
                    disabled={tierSelections.length === 0}
                    data-testid="button-submit"
                  >
                    Review & Create Campaign
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => navigate("/sponsor/campaigns")}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Campaign Creation</DialogTitle>
            <DialogDescription>
              Please review all details before creating your campaign
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Campaign Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-4 rounded-lg">
                <div>
                  <span className="text-muted-foreground">Title:</span>
                  <p className="font-medium">{formData.title}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Brand:</span>
                  <p className="font-medium">{formData.brand}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium">{getCategoryLabel()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Promotion Style:</span>
                  <p className="font-medium">{getPromotionStyleLabel()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Content Types:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.types.map(t => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {CONTENT_TYPES.find(ct => ct.id === t)?.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Deadline:
                  </span>
                  <p className="font-medium">{new Date(formData.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Tier & Creator Selection
              </h4>
              <div className="space-y-2">
                {tierSelections.sort((a, b) => a.tierId - b.tierId).map(selection => (
                  <div key={selection.tierName} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <div>
                      <span className="font-medium">{selection.tierName}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        ({selection.minFollowers >= 1000000 
                          ? `${(selection.minFollowers / 1000000).toFixed(1)}M` 
                          : `${(selection.minFollowers / 1000)}K`}+ followers)
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{selection.creatorsNeeded} creators</div>
                      <div className="text-sm text-muted-foreground">
                        {formatINR(selection.paymentPerCreator)} each = {formatINR(selection.paymentPerCreator * selection.creatorsNeeded)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Payment Breakdown
              </h4>
              <div className={`p-4 rounded-lg ${hasInsufficientBalance ? "bg-red-50 dark:bg-red-900/20 border border-red-200" : "bg-green-50 dark:bg-green-900/20 border border-green-200"}`}>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Creator Payments</span>
                    <span className="font-medium">{formatINR(paymentBreakdown.creatorPayment)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Platform Fee ({TAX_RATES.PLATFORM_FEE_PERCENT}%)</span>
                    <span className="font-medium">{formatINR(paymentBreakdown.platformFee)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-medium">Total Payable</span>
                  <span className="text-2xl font-bold">{formatINR(totalPayable)}</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed">
                  <span className="text-muted-foreground">Your Wallet Balance</span>
                  <span className={`font-semibold ${hasInsufficientBalance ? "text-red-500" : "text-green-600"}`}>
                    {formatINR(walletBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-3 border-t">
                  <span className="font-medium">Balance After Deduction</span>
                  <span className={`font-bold ${hasInsufficientBalance ? "text-red-500" : "text-green-600"}`}>
                    {hasInsufficientBalance ? (
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Insufficient Balance
                      </span>
                    ) : (
                      formatINR(walletBalance - totalPayable)
                    )}
                  </span>
                </div>
              </div>

              {hasInsufficientBalance && (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200">
                  <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    You need to add {formatINR(totalPayable - walletBalance)} to your wallet to create this campaign.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setShowConfirmDialog(false);
                      navigate("/sponsor/wallet");
                    }}
                  >
                    Go to Wallet
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isCreating}
            >
              Go Back & Edit
            </Button>
            <Button
              onClick={handleConfirmCreate}
              disabled={isCreating || hasInsufficientBalance}
              className="gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirm & Create {tierSelections.length > 1 ? `${tierSelections.length} Campaigns` : "Campaign"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
