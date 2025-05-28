import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Plus, Trash2, Upload, Info, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEventCreation } from '@/hooks/useEventCreation';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

// Define form schema using Zod
const eventFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  date: z.string().min(1, { message: "Date is required" }),
  time: z.string().min(1, { message: "Time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  location: z.string().min(1, { message: "Location is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  organizer: z.string().min(1, { message: "Organizer name is required" }),
  coverImage: z.string().optional(),
});

// Define ticket type schema
const ticketTypeSchema = z.object({
  name: z.string().min(1, { message: "Ticket name is required" }),
  price: z.string().min(1, { message: "Price is required" }), // Converted to number later
  quantity: z.string().min(1, { message: "Quantity is required" }), // Converted to number later
  description: z.string().optional(),
});

// Helper to convert date and time strings to ISO string
const combineDateTime = (date: string, time: string): string => {
  if (!date || !time) return new Date().toISOString();
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes).toISOString();
};

const CreateEventPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('details');
  const [isDraft, setIsDraft] = useState(false);
  const [ticketTypes, setTicketTypes] = useState([
    { name: 'General Admission', price: '0.5', quantity: '100', description: 'Standard entry to the event' }
  ]);
  const [royaltyPercentage, setRoyaltyPercentage] = useState('5');
  const [resaleAllowed, setResaleAllowed] = useState(true);
  const [maxResalePrice, setMaxResalePrice] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { createEvent, isCreating } = useEventCreation();
  
  // Set up form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      time: '',
      endTime: '',
      location: '',
      category: '',
      organizer: '',
      coverImage: '',
    },
  });

  const handleAddTicketType = () => {
    setTicketTypes([
      ...ticketTypes,
      { name: '', price: '', quantity: '', description: '' }
    ]);
  };

  const handleRemoveTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      const updatedTicketTypes = [...ticketTypes];
      updatedTicketTypes.splice(index, 1);
      setTicketTypes(updatedTicketTypes);
    } else {
      toast({
        title: "Cannot Remove",
        description: "You must have at least one ticket type.",
        variant: "destructive",
      });
    }
  };

  const handleTicketTypeChange = (index: number, field: keyof typeof ticketTypes[0], value: string) => {
    const updatedTicketTypes = [...ticketTypes];
    updatedTicketTypes[index] = {
      ...updatedTicketTypes[index],
      [field]: value,
    };
    setTicketTypes(updatedTicketTypes);
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    try {
      setIsUploading(true);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('event-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(error.message);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-photos')
        .getPublicUrl(data.path);

      console.log('Image uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create local preview URL
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewImage(localPreviewUrl);
      
      // Upload to Supabase
      const uploadedUrl = await uploadImageToSupabase(file);
      setUploadedImageUrl(uploadedUrl);
      form.setValue('coverImage', uploadedUrl);
      
      toast({
        title: "Image Uploaded",
        description: "Your event image has been uploaded successfully",
      });
    } catch (error) {
      // Reset preview on error
      setPreviewImage('');
      setUploadedImageUrl('');
      form.setValue('coverImage', '');
    }
  };

  const saveEventDraft = async () => {
    // Validate the current tab
    if (currentTab === 'details') {
      const isValid = await form.trigger(['title', 'description']);
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please fill in at least the title and description to save as draft",
          variant: "destructive",
        });
        return;
      }
    }

    // Save to local storage as draft
    const formData = form.getValues();
    const draftData = {
      ...formData,
      ticketTypes,
      royaltyPercentage,
      resaleAllowed,
      maxResalePrice,
      previewImage,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem('eventDraft', JSON.stringify(draftData));
    setIsDraft(true);
    
    toast({
      title: "Draft Saved",
      description: "Your event has been saved as a draft",
    });
  };

  const loadDraftEvent = () => {
    const draftData = localStorage.getItem('eventDraft');
    if (draftData) {
      try {
        const parsedDraft = JSON.parse(draftData);
        // Fill the form with draft data
        Object.entries(parsedDraft).forEach(([key, value]) => {
          if (key in form.getValues() && typeof value === 'string') {
            form.setValue(key as any, value);
          }
        });
        
        if (parsedDraft.ticketTypes) {
          setTicketTypes(parsedDraft.ticketTypes);
        }
        
        if (parsedDraft.royaltyPercentage) {
          setRoyaltyPercentage(parsedDraft.royaltyPercentage);
        }
        
        if ('resaleAllowed' in parsedDraft) {
          setResaleAllowed(parsedDraft.resaleAllowed);
        }
        
        if (parsedDraft.maxResalePrice) {
          setMaxResalePrice(parsedDraft.maxResalePrice);
        }
        
        if (parsedDraft.previewImage) {
          setPreviewImage(parsedDraft.previewImage);
        }

        setIsDraft(true);
        
        toast({
          title: "Draft Loaded",
          description: "Your draft event has been loaded",
        });
      } catch (error) {
        console.error('Error loading draft:', error);
        toast({
          title: "Error Loading Draft",
          description: "There was an error loading your draft",
          variant: "destructive",
        });
      }
    }
  };

  // Load draft on initial render
  useEffect(() => {
    loadDraftEvent();
  }, []);

  const navigateToTab = (tab: string) => {
    // Validate before changing tabs
    if (currentTab === 'details' && tab === 'tickets') {
      form.trigger(['title', 'description', 'date', 'time', 'endTime', 'location', 'category', 'organizer'])
        .then(isValid => {
          if (isValid) {
            setCurrentTab(tab);
          } else {
            toast({
              title: "Validation Error",
              description: "Please fill in all required fields before continuing",
              variant: "destructive",
            });
          }
        });
    } else if (currentTab === 'tickets' && tab === 'royalties') {
      // Validate ticket types
      const ticketValidation = ticketTypes.every(ticket => 
        ticket.name && ticket.price && ticket.quantity
      );

      if (ticketValidation) {
        setCurrentTab(tab);
      } else {
        toast({
          title: "Invalid Ticket Types",
          description: "Please complete all required ticket information",
          variant: "destructive",
        });
      }
    } else if (tab === 'details' && currentTab === 'tickets') {
      setCurrentTab(tab);
    } else {
      setCurrentTab(tab);
    }
  };

  const onSubmit = async (data: z.infer<typeof eventFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Validate ticket types
      const ticketValidation = ticketTypes.every(ticket => 
        ticket.name && ticket.price && ticket.quantity
      );

      if (!ticketValidation) {
        toast({
          title: "Invalid Ticket Types",
          description: "Please complete all required ticket information.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Calculate total tickets from all ticket types
      const totalTickets = ticketTypes.reduce((sum, ticket) => sum + Number(ticket.quantity), 0);
      
      // Use the price from the first ticket type for now (in a real app, you'd handle multiple price tiers)
      const mainPrice = parseFloat(ticketTypes[0].price);
      
      // Combine date and time for the event date
      const eventDateTime = combineDateTime(data.date, data.time);
      
      // Prepare event data for creation (event will be published by default)
      const eventData = {
        title: data.title,
        description: data.description,
        date: eventDateTime,
        location: data.location,
        price: mainPrice,
        total_tickets: totalTickets,
        image_url: uploadedImageUrl || 'https://images.unsplash.com/photo-1591522811280-a8759970b03f',
      };

      // Submit the event to the database
      const success = await createEvent(eventData);
      
      if (success) {
        // Clear the draft from local storage
        localStorage.removeItem('eventDraft');
        
        // Clean up local preview URL
        if (previewImage.startsWith('blob:')) {
          URL.revokeObjectURL(previewImage);
        }
        
        // Show success message
        toast({
          title: "Event Created and Published!",
          description: "Your event has been created and is now live.",
        });
        
        // Navigation will be handled by useEventCreation hook
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: "Error Creating Event",
        description: error.message || "There was an error creating your event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
          <p className="text-muted-foreground mb-8">
            Create an event with NFT tickets on the Solana blockchain.
          </p>
          
          <Tabs value={currentTab} onValueChange={navigateToTab}>
            <TabsList className="w-full mb-8 glass-card">
              <TabsTrigger value="details" className="flex-1">Event Details</TabsTrigger>
              <TabsTrigger value="tickets" className="flex-1">Ticket NFTs</TabsTrigger>
              <TabsTrigger value="royalties" className="flex-1">Royalties & Resale</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <TabsContent value="details">
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Information</CardTitle>
                      <CardDescription>
                        Enter the basic details of your event
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Solana Summer Hackathon" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Technology">Technology</SelectItem>
                                  <SelectItem value="Music">Music</SelectItem>
                                  <SelectItem value="Art">Art</SelectItem>
                                  <SelectItem value="Business">Business</SelectItem>
                                  <SelectItem value="Gaming">Gaming</SelectItem>
                                  <SelectItem value="Networking">Networking</SelectItem>
                                  <SelectItem value="Finance">Finance</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your event in detail..." 
                                className="min-h-[120px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="Virtual Event or Physical Address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="organizer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organizer Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Who's hosting this event?" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="coverImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cover Image</FormLabel>
                            <FormControl>
                              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-card transition-all"
                                onClick={() => !isUploading && document.getElementById('image-upload')?.click()}
                              >
                                <input
                                  id="image-upload"
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  disabled={isUploading}
                                />
                                
                                {previewImage ? (
                                  <div className="w-full relative">
                                    <img 
                                      src={previewImage} 
                                      alt="Event cover preview" 
                                      className="w-full h-48 object-cover rounded-lg"
                                    />
                                    <Button 
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="absolute top-2 right-2 glass-button"
                                      disabled={isUploading}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (previewImage.startsWith('blob:')) {
                                          URL.revokeObjectURL(previewImage);
                                        }
                                        setPreviewImage('');
                                        setUploadedImageUrl('');
                                        form.setValue('coverImage', '');
                                      }}
                                    >
                                      Change Image
                                    </Button>
                                    {isUploading && (
                                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                        <div className="text-white text-sm">Uploading...</div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground text-sm">
                                      {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      SVG, PNG, JPG or GIF (max. 5MB)
                                    </p>
                                  </>
                                )}
                              </div>
                            </FormControl>
                            <FormDescription>
                              This image will be stored securely in Supabase storage.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" type="button" onClick={saveEventDraft}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => navigateToTab('tickets')}
                      >
                        Continue to Tickets
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="tickets">
                  <Card>
                    <CardHeader>
                      <CardTitle>NFT Ticket Configuration</CardTitle>
                      <CardDescription>
                        Create different ticket types and set their prices
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-card border border-border rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-4 mb-4">
                          <Info className="h-6 w-6 text-solana-blue flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="font-medium">NFT Ticket Information</h4>
                            <p className="text-sm text-muted-foreground">
                              Each ticket will be minted as a dynamic NFT on Solana. The NFT will evolve:
                            </p>
                            <ul className="text-sm text-muted-foreground list-disc ml-5 mt-2">
                              <li>Before the event: Shows countdown and ticket information</li>
                              <li>During check-in: Displays QR code for verification</li>
                              <li>After attendance: Transforms into a collectible with special benefits</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      {ticketTypes.map((ticket, index) => (
                        <div key={index} className="p-6 border border-border rounded-xl">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">Ticket Type {index + 1}</h3>
                            {ticketTypes.length > 1 && (
                              <Button 
                                type="button"
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleRemoveTicketType(index)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <FormLabel>Ticket Name</FormLabel>
                              <Input 
                                placeholder="e.g., General Admission" 
                                value={ticket.name}
                                onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <FormLabel>Price (SOL)</FormLabel>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  placeholder="e.g., 0.5" 
                                  value={ticket.price}
                                  onChange={(e) => handleTicketTypeChange(index, 'price', e.target.value)}
                                />
                              </div>
                              
                              <div>
                                <FormLabel>Quantity</FormLabel>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  placeholder="e.g., 100" 
                                  value={ticket.quantity}
                                  onChange={(e) => handleTicketTypeChange(index, 'quantity', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <FormLabel>Description (Optional)</FormLabel>
                            <Textarea 
                              placeholder="What's included with this ticket?" 
                              value={ticket.description}
                              onChange={(e) => handleTicketTypeChange(index, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTicketType}
                        className="w-full glass-button"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Ticket Type
                      </Button>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        type="button" 
                        onClick={() => navigateToTab('details')}
                      >
                        Back to Details
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => navigateToTab('royalties')}
                      >
                        Continue to Royalties
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="royalties">
                  <Card>
                    <CardHeader>
                      <CardTitle>Royalties & Resale Rules</CardTitle>
                      <CardDescription>
                        Configure how secondary sales work for your tickets
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-card border border-border rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-4">
                          <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="font-medium">Important Information</h4>
                            <p className="text-sm text-muted-foreground">
                              Setting up royalties allows you to earn a percentage of all secondary market sales.
                              This is enforced on-chain for integrated marketplaces.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <FormLabel>Royalty Percentage</FormLabel>
                          <div className="flex items-center gap-4">
                            <Input 
                              type="number" 
                              min="0" 
                              max="50" 
                              value={royaltyPercentage}
                              onChange={(e) => setRoyaltyPercentage(e.target.value)}
                              className="w-32"
                            />
                            <span>%</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            You'll receive this percentage of every resale. Industry standard is 5-10%.
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="resale-allowed"
                            checked={resaleAllowed}
                            onChange={() => setResaleAllowed(!resaleAllowed)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="resale-allowed" className="text-sm font-medium">
                            Allow tickets to be resold on secondary markets
                          </label>
                        </div>
                        
                        {resaleAllowed && (
                          <div>
                            <FormLabel>Maximum Resale Price (Optional)</FormLabel>
                            <div className="flex items-center gap-4">
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                placeholder="e.g., 2.5" 
                                value={maxResalePrice}
                                onChange={(e) => setMaxResalePrice(e.target.value)}
                                className="w-32"
                              />
                              <span>SOL</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Leave blank for no maximum price. This helps prevent scalping.
                            </p>
                          </div>
                        )}
                        
                        <div className="p-4 border border-border rounded-lg">
                          <h4 className="font-medium mb-2">Royalty Calculation Example</h4>
                          <p className="text-sm text-muted-foreground">
                            For a ticket that sells for 1 SOL on the secondary market with a {royaltyPercentage}% royalty:
                          </p>
                          <div className="mt-2 p-2 bg-card rounded">
                            <p className="text-sm flex justify-between">
                              <span>Original seller receives:</span> 
                              <span className="font-mono">{(1 * (1 - parseFloat(royaltyPercentage) / 100)).toFixed(3)} SOL</span>
                            </p>
                            <p className="text-sm flex justify-between">
                              <span>You receive (royalty):</span> 
                              <span className="font-mono">{(1 * parseFloat(royaltyPercentage) / 100).toFixed(3)} SOL</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                      <Button 
                        className="w-full bg-solana-gradient hover:opacity-90 text-white" 
                        type="submit"
                        disabled={isSubmitting || isCreating}
                      >
                        {isSubmitting || isCreating ? 'Creating Event...' : 'Create Event'}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        By creating this event, you'll initiate a transaction on the Solana blockchain.
                        This will create the event metadata and set up the NFT ticket system.
                      </p>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </form>
            </Form>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateEventPage;
