import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Building, 
  MapPin, 
  Phone, 
  Calendar, 
  Shield, 
  Users, 
  Target, 
  Database,
  Eye,
  EyeOff,
  Copy,
  Check,
  Crown,
  Star,
  Award,
  TrendingUp,
  Activity,
  Settings,
  Edit3,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useAzureAuthStore, usePermissions } from '@/stores/azureAuthStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { fetchCompleteUserProfile, refreshUserProfile, type CompleteUserProfile } from '@/api/complete-user-profile'

export default function UserProfilePage() {
  const [userProfile, setUserProfile] = useState<CompleteUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSensitiveData, setShowSensitiveData] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const { user, accessToken } = useAzureAuthStore()
  const { hasPermission, isAdmin, isExecutive, isManager } = usePermissions()

  useEffect(() => {
    const fetchUserProfileData = async () => {
      if (!user?.id || !accessToken) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        console.log('🔍 Fetching complete user profile for:', user.id)
        
        const profileData = await fetchCompleteUserProfile(user.id, accessToken)
        
        if (profileData) {
          setUserProfile(profileData)
          console.log('✅ User profile loaded successfully')
        } else {
          console.warn('⚠️ No profile data found')
          toast.error('No profile data found for this user')
        }
      } catch (error) {
        console.error('❌ Error fetching user profile:', error)
        toast.error('Failed to load user profile')
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfileData()
  }, [user?.id, accessToken])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success(`${field} copied to clipboard`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleRefreshProfile = async () => {
    if (!user?.id || !accessToken) {
      toast.error('User not authenticated')
      return
    }

    setLoading(true)
    try {
      console.log('🔄 Refreshing user profile...')
      
      const refreshSuccess = await refreshUserProfile(user.id, accessToken)
      
      if (refreshSuccess) {
        // Re-fetch the profile data
        const profileData = await fetchCompleteUserProfile(user.id, accessToken)
        if (profileData) {
          setUserProfile(profileData)
          toast.success('Profile refreshed successfully')
        }
      } else {
        toast.error('Failed to refresh profile')
      }
    } catch (error) {
      console.error('❌ Error refreshing profile:', error)
      toast.error('Failed to refresh profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading profile data...</span>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
          <p className="text-muted-foreground mb-4">
            Unable to load user profile data from the database.
          </p>
          <Button onClick={handleRefreshProfile}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800 border-red-200'
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'executive': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'user': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'dashboard_user': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Crown className="h-4 w-4" />
      case 'admin': return <Shield className="h-4 w-4" />
      case 'executive': return <Star className="h-4 w-4" />
      case 'manager': return <Users className="h-4 w-4" />
      case 'user': return <User className="h-4 w-4" />
      case 'dashboard_user': return <Activity className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
          <p className="text-muted-foreground">
            Complete user data and table mappings from Azure PostgreSQL
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSensitiveData(!showSensitiveData)}>
            {showSensitiveData ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showSensitiveData ? 'Hide' : 'Show'} Sensitive Data
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshProfile} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={userProfile.profile.avatar_url} alt={userProfile.profile.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                  {userProfile.profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{userProfile.profile.name}</h2>
                    <Badge className={cn("border", getRoleBadgeColor(userProfile.role.role))}>
                      {getRoleIcon(userProfile.role.role)}
                      <span className="ml-1 capitalize">{userProfile.role.role}</span>
                    </Badge>
                    {userProfile.isTeamLeader && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Crown className="h-3 w-3 mr-1" />
                        Team Leader
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-gray-700 font-medium">{userProfile.profile.jobtitle}</p>
                  <p className="text-gray-600">{userProfile.profile.department}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{userProfile.profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building className="h-4 w-4" />
                    <span className="text-sm">{userProfile.primaryTeam || 'No team assigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">{userProfile.targetProgress || 0}% of monthly target</span>
                  </div>
                </div>

                {userProfile.currentMonthTarget && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Monthly Target Progress</span>
                      <span>{userProfile.targetProgress || 0}%</span>
                    </div>
                    <Progress value={userProfile.targetProgress || 0} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Data Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">Profile Data</TabsTrigger>
            <TabsTrigger value="role">Role & Permissions</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="mapping">Account Mapping</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Profile Table Data
                </CardTitle>
                <CardDescription>Data from the profiles table in Azure PostgreSQL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">User ID</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                        {showSensitiveData ? userProfile.profile.user_id : '••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(userProfile.profile.user_id, 'User ID')}
                      >
                        {copiedField === 'User ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Azure ID</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                        {showSensitiveData ? userProfile.profile.AzureID : '••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(userProfile.profile.AzureID, 'Azure ID')}
                      >
                        {copiedField === 'Azure ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <div className="bg-gray-50 px-3 py-2 rounded border">
                      {userProfile.profile.name}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="bg-gray-50 px-3 py-2 rounded border">
                      {userProfile.profile.email}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Job Title</label>
                    <div className="bg-gray-50 px-3 py-2 rounded border">
                      {userProfile.profile.jobtitle || 'Not specified'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Department</label>
                    <div className="bg-gray-50 px-3 py-2 rounded border">
                      {userProfile.profile.department || 'Not specified'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Account Enabled</label>
                    <div className="flex items-center gap-2">
                      <Badge variant={userProfile.profile.accountenabled ? "default" : "destructive"}>
                        {userProfile.profile.accountenabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Avatar URL</label>
                    <div className="bg-gray-50 px-3 py-2 rounded border text-sm">
                      {userProfile.profile.avatar_url ? (
                        <a href={userProfile.profile.avatar_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Avatar
                        </a>
                      ) : (
                        'No avatar set'
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Created At</label>
                    <div className="bg-gray-50 px-3 py-2 rounded border text-sm">
                      {new Date(userProfile.profile.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Updated At</label>
                    <div className="bg-gray-50 px-3 py-2 rounded border text-sm">
                      {new Date(userProfile.profile.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="role" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Role & Permissions Data
                </CardTitle>
                <CardDescription>Data from the user_roles table and computed permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Role ID</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                        {showSensitiveData ? userProfile.role.id : '••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(userProfile.role.id || '', 'Role ID')}
                      >
                        {copiedField === 'Role ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("border", getRoleBadgeColor(userProfile.role.role))}>
                        {getRoleIcon(userProfile.role.role)}
                        <span className="ml-1 capitalize">{userProfile.role.role}</span>
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Permissions ({userProfile.permissions.length})</label>
                  <div className="bg-gray-50 p-4 rounded border">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {userProfile.permissions.map((permission, index) => (
                        <Badge key={index} variant="outline" className="justify-start">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Memberships
                </CardTitle>
                <CardDescription>Data from the teams table and team relationships</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userProfile.teams.length > 0 ? (
                    userProfile.teams.map((team, index) => (
                      <motion.div
                        key={team.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: team.color || '#3B82F6' }}
                            />
                            <h4 className="font-semibold">{team.name}</h4>
                            {team.is_leader && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                <Crown className="h-3 w-3 mr-1" />
                                Leader
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline">{team.id}</Badge>
                        </div>
                        
                        {team.description && (
                          <p className="text-sm text-gray-600">{team.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Created:</span>
                            <span className="ml-2 text-gray-600">
                              {new Date(team.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Role:</span>
                            <span className="ml-2 text-gray-600">
                              {team.is_leader ? 'Team Leader' : 'Member'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No team memberships found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="targets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Goals & Targets
                </CardTitle>
                <CardDescription>Data from the team_forecasts table</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userProfile.targets.length > 0 ? (
                    userProfile.targets.map((target, index) => {
                      const progress = target.actual_amount ? (target.actual_amount / target.target_amount) * 100 : 0
                      const team = userProfile.teams.find(t => t.id === target.team_id)
                      
                      return (
                        <motion.div
                          key={target.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold">
                                {new Date(target.year, target.month - 1).toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}
                              </h4>
                              <Badge variant="outline">{team?.name || 'Unknown Team'}</Badge>
                            </div>
                            <Badge 
                              variant={progress >= 100 ? "default" : progress >= 80 ? "secondary" : "destructive"}
                            >
                              {progress.toFixed(1)}%
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Target Amount</span>
                              <p className="text-lg font-semibold text-blue-600">
                                ${target.target_amount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Actual Amount</span>
                              <p className="text-lg font-semibold text-green-600">
                                ${(target.actual_amount || 0).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Variance</span>
                              <p className={cn(
                                "text-lg font-semibold",
                                (target.actual_amount || 0) >= target.target_amount ? "text-green-600" : "text-red-600"
                              )}>
                                ${((target.actual_amount || 0) - target.target_amount).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{progress.toFixed(1)}%</span>
                            </div>
                            <Progress value={Math.min(progress, 100)} className="h-2" />
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No targets found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Account Mapping
                </CardTitle>
                <CardDescription>Data from the account_mapping table</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Mapping ID</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                        {showSensitiveData ? userProfile.accountMapping.id : '••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(userProfile.accountMapping.id || '', 'Mapping ID')}
                      >
                        {copiedField === 'Mapping ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Salesforce ID</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                        {showSensitiveData ? (userProfile.accountMapping.salesforce_id || 'Not mapped') : '••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(userProfile.accountMapping.salesforce_id || '', 'Salesforce ID')}
                      >
                        {copiedField === 'Salesforce ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="bg-gray-50 px-3 py-2 rounded border">
                      {userProfile.accountMapping.email}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <div className="bg-gray-50 px-3 py-2 rounded border">
                      {userProfile.accountMapping.name}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raw" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Raw JSON Data
                </CardTitle>
                <CardDescription>Complete user profile data structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(userProfile, null, 2), 'Raw Data')}
                    >
                      {copiedField === 'Raw Data' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      Copy JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSensitiveData(!showSensitiveData)}
                    >
                      {showSensitiveData ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showSensitiveData ? 'Hide' : 'Show'} Sensitive Data
                    </Button>
                  </div>
                  
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                    <pre className="text-sm">
                      {JSON.stringify(
                        showSensitiveData 
                          ? userProfile 
                          : {
                              ...userProfile,
                              azureId: '••••••••',
                              profile: {
                                ...userProfile.profile,
                                user_id: '••••••••',
                                AzureID: '••••••••'
                              },
                              role: {
                                ...userProfile.role,
                                id: '••••••••',
                                supabase_user_id: '••••••••'
                              },
                              accountMapping: {
                                ...userProfile.accountMapping,
                                id: '••••••••',
                                user_id: '••••••••',
                                salesforce_id: '••••••••',
                                azure_id: '••••••••'
                              }
                            }, 
                        null, 
                        2
                      )}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
} 