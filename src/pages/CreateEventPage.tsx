
import { useState } from 'react';
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
import { AlertTriangle, Plus, Trash2, Upload, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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

const CreateEventPage = () => {
  const { toast } = useToast();
  const [ticketTypes, setTicketTypes] = useState([
    { name: 'General Admission', price: '0.5', quantity: '100', description: 'Standard entry to the event' }
  ]);
  const [royaltyPercentage, setRoyaltyPercentage] = useState('5');
  const [resaleAllowed, setResaleAllowed] = useState(true);
  const [maxResalePrice, setMaxResalePrice] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, this would upload to IPFS/Arweave
      // Here we just create a local URL for preview
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      form.setValue('coverImage', file.name);
    }
  };

  const onSubmit = (data: z.infer<typeof eventFormSchema>) => {
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
      return;
    }

    // In a real app, this would submit to Solana blockchain via a transaction
    console.log("Event Data:", data);
    console.log("Ticket Types:", ticketTypes);
    console.log("Royalty Percentage:", royaltyPercentage);
    console.log("Resale Allowed:", resaleAllowed);
    console.log("Max Resale Price:", maxResalePrice);

    toast({
      title: "Event Created!",
      description: "Your event has been created (simulated).",
    });
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
          
          <Tabs defaultValue="details">
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
                                onClick={() => document.getElementById('image-upload')?.click()}
                              >
                                <input
                                  id="image-upload"
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleImageUpload}
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImage('');
                                        form.setValue('coverImage', '');
                                      }}
                                    >
                                      Change Image
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground text-sm">
                                      Click to upload or drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      SVG, PNG, JPG or GIF (max. 5MB)
                                    </p>
                                  </>
                                )}
                              </div>
                            </FormControl>
                            <FormDescription>
                              This image will be uploaded to IPFS/Arweave for decentralized storage.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" type="button">
                        Save Draft
                      </Button>
                      <Button type="button" onClick={() => form.trigger(['title', 'description', 'date', 'time', 'endTime', 'location', 'category', 'organizer'])}>
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
                      <Button variant="outline" type="button">
                        Back to Details
                      </Button>
                      <Button type="button">
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
                      <Button className="w-full bg-solana-gradient hover:opacity-90 text-white" type="submit">
                        Create Event
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
