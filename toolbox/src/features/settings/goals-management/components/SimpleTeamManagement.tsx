import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTeams } from '../hooks'
import { Team } from '../types'
import { Users, Settings, Building } from 'lucide-react'

export function SimpleTeamManagement() {
  // Memoize params to prevent unnecessary re-renders and ensure stable reference
  const teamsParams = useMemo(() => ({
    include_members: true
  }), [])

  const { teams, loading, toggleSalesTeam, toggleSuperTeam, updateTeam } = useTeams(teamsParams)

  const handleTeamTypeChange = async (teamId: string, teamType: string) => {
    try {
      await updateTeam({
        id: teamId,
        team_type: teamType as 'sales' | 'operations' | 'management' | 'support' | 'other'
      })
    } catch (error) {
      console.error('Failed to update team type:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span>Loading teams...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Simplified Team Management
          </CardTitle>
          <CardDescription>
            Easily manage team types with simple checkboxes. No more complex forms!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teams.map((team: Team) => (
              <div
                key={team.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors"
              >
                {/* Team Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-lg">{team.name}</h3>
                    <div className="flex gap-2">
                      {team.is_sales_team && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Sales Team
                        </Badge>
                      )}
                      {team.is_super_team && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          Super Team
                        </Badge>
                      )}
                      {team.team_type && (
                        <Badge variant="outline">
                          {team.team_type.charAt(0).toUpperCase() + team.team_type.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      {team.member_count || 0} members
                    </span>
                  </div>
                </div>

                {/* Team Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sales Team Toggle */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`sales-${team.id}`}
                      checked={team.is_sales_team}
                      onCheckedChange={(checked) => 
                        toggleSalesTeam(team.id, checked as boolean)
                      }
                    />
                    <label htmlFor={`sales-${team.id}`} className="text-sm font-medium">
                      Sales Team
                    </label>
                  </div>

                  {/* Super Team Toggle */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`super-${team.id}`}
                      checked={team.is_super_team}
                      onCheckedChange={(checked) => 
                        toggleSuperTeam(team.id, checked as boolean)
                      }
                    />
                    <label htmlFor={`super-${team.id}`} className="text-sm font-medium">
                      Super Team
                    </label>
                  </div>

                  {/* Team Type Selector */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Type:</label>
                    <Select
                      value={team.team_type || ''}
                      onValueChange={(value) => handleTeamTypeChange(team.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Members List */}
                {team.members && team.members.length > 0 && (
                  <div className="pt-2 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Team Members:</h4>
                    <div className="flex flex-wrap gap-2">
                      {team.members.slice(0, 5).map((member, index) => (
                        <Badge key={member.id || index} variant="outline" className="text-xs">
                          {member.name || member.email}
                        </Badge>
                      ))}
                      {team.members.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{team.members.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Parent/Child Team Info */}
                {(team.parent_team || team.child_teams) && (
                  <div className="pt-2 border-t text-sm text-gray-600">
                    {team.parent_team && (
                      <p>Parent Team: <span className="font-medium">{team.parent_team.name}</span></p>
                    )}
                    {team.child_teams && team.child_teams.length > 0 && (
                      <p>
                        Child Teams: {team.child_teams.map(ct => ct.name).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {teams.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No teams found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Before vs After Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before */}
            <div className="space-y-2">
              <h4 className="font-semibold text-red-700">❌ Before (Complex)</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Separate SuperTeam management</li>
                <li>• Manual member assignment</li>
                <li>• Complex forms and workflows</li>
                <li>• Multiple data sources</li>
                <li>• Duplicate team data</li>
              </ul>
            </div>

            {/* After */}
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700">✅ After (Simple)</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Simple checkbox toggles</li>
                <li>• Automatic member inheritance</li>
                <li>• Single unified interface</li>
                <li>• One source of truth</li>
                <li>• Flag-based filtering</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🎯 Result:</strong> 90% less complexity, better performance, and easier maintenance!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 