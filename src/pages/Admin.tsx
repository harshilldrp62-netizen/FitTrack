import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileText, BarChart3, Search, Ban, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { auth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAILS = [
  "admin@fittrack.com",
  "admin1@fittrack.com",
  "admin2@fittrack.com",
  "admin3@fittrack.com",
];

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    dau: 0,
    popularWorkouts: [],
    onboardingRate: 0,
  });

  useEffect(() => {
    // Check if user is admin
    const user = auth.currentUser;
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/home");
      return;
    }

    // Load mock user data (in real app, fetch from backend)
    const mockUsers = [
      { id: "1", name: "John Doe", email: "john@example.com", joinDate: "2024-01-15", goal: "Lose Weight", status: "active" },
      { id: "2", name: "Jane Smith", email: "jane@example.com", joinDate: "2024-02-20", goal: "Build Muscle", status: "active" },
      { id: "3", name: "Bob Johnson", email: "bob@example.com", joinDate: "2024-03-10", goal: "Maintain", status: "suspended" },
    ];
    setUsers(mockUsers);

    // Load mock analytics
    setAnalytics({
      dau: 1250,
      popularWorkouts: [
        { name: "HIIT Cardio", count: 450 },
        { name: "Full Body", count: 320 },
        { name: "Yoga Flow", count: 280 },
      ],
      onboardingRate: 87.5,
    });
  }, [navigate, toast]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBan = (userId: string) => {
    // In real app, call backend API
    toast({
      title: "User banned",
      description: "User has been banned successfully.",
    });
  };

  const handleSuspend = (userId: string) => {
    // In real app, call backend API
    toast({
      title: "User suspended",
      description: "User has been suspended successfully.",
    });
  };

  const dauData = [
    { day: "Mon", users: 1200 },
    { day: "Tue", users: 1300 },
    { day: "Wed", users: 1250 },
    { day: "Thu", users: 1400 },
    { day: "Fri", users: 1350 },
    { day: "Sat", users: 1100 },
    { day: "Sun", users: 1000 },
  ];

  return (
    <div className="mobile-page">
      {/* Header */}
      <header className="mobile-header border-b border-border">
        <h1 className="mobile-title text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Manage users and content</p>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content">
            <FileText className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* User Table */}
            <div className="bg-card rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-base font-semibold">Name</th>
                      <th className="px-4 py-3 text-left text-base font-semibold">Email</th>
                      <th className="px-4 py-3 text-left text-base font-semibold">Join Date</th>
                      <th className="px-4 py-3 text-left text-base font-semibold">Goal</th>
                      <th className="px-4 py-3 text-left text-base font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-border/50">
                        <td className="px-4 py-3">{user.name}</td>
                        <td className="px-4 py-3 text-base text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3 text-base">{user.joinDate}</td>
                        <td className="px-4 py-3 text-base">{user.goal}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuspend(user.id)}
                            >
                              Suspend
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleBan(user.id)}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Ban
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-6">
          <div className="space-y-6">
            {/* Workout Creator */}
            <div className="bg-card rounded-xl p-4 border">
              <h2 className="text-lg font-semibold mb-4">Create Workout</h2>
              <div className="space-y-4">
                <Input placeholder="Workout name" />
                <Input placeholder="Duration (minutes)" type="number" />
                <Input placeholder="Difficulty (Easy/Medium/Hard)" />
                <Input placeholder="Type (Strength/Cardio/etc)" />
                <Button className="w-full">Create Workout</Button>
              </div>
            </div>

            {/* Food Database Editor */}
            <div className="bg-card rounded-xl p-4 border">
              <h2 className="text-lg font-semibold mb-4">Food Database Editor</h2>
              <div className="space-y-4">
                <Input placeholder="Food name" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Calories" type="number" />
                  <Input placeholder="Protein (g)" type="number" />
                  <Input placeholder="Carbs (g)" type="number" />
                  <Input placeholder="Fat (g)" type="number" />
                </div>
                <Button className="w-full">Add Food</Button>
              </div>
            </div>

            {/* Announcement Broadcaster */}
            <div className="bg-card rounded-xl p-4 border">
              <h2 className="text-lg font-semibold mb-4">Send Announcement</h2>
              <div className="space-y-4">
                <Input placeholder="Title" />
                <textarea
                  placeholder="Message"
                  className="w-full min-h-[100px] px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Button className="w-full">Broadcast</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            {/* DAU Chart */}
            <div className="bg-card rounded-xl p-4 border">
              <h2 className="text-lg font-semibold mb-4">Daily Active Users</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dauData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Popular Workouts */}
            <div className="bg-card rounded-xl p-4 border">
              <h2 className="text-lg font-semibold mb-4">Popular Workouts</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.popularWorkouts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card rounded-xl p-4 border text-center">
                <p className="text-xl font-bold">{analytics.dau}</p>
                <p className="text-base text-muted-foreground">Daily Active Users</p>
              </div>
              <div className="bg-card rounded-xl p-4 border text-center">
                <p className="text-xl font-bold">{analytics.onboardingRate}%</p>
                <p className="text-base text-muted-foreground">Onboarding Rate</p>
              </div>
              <div className="bg-card rounded-xl p-4 border text-center">
                <p className="text-xl font-bold">{users.length}</p>
                <p className="text-base text-muted-foreground">Total Users</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
