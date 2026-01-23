import React, { useState, useMemo, useCallback } from 'react';
import {
    Mail, Phone, MapPin, Award, MoreVertical, Search, Filter,
    Users, Briefcase, Clock, UserCheck, ChevronDown, Plus, Eye, Trash2, X, RefreshCw, Calendar
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useTeams } from '../contexts/TeamsContext';
import { toast } from 'react-hot-toast';
import Skeleton from '../components/ui/Skeleton';
import CreateTeamMemberModal from '../components/CreateTeamMemberModal';
import EngineerProfilePanel from '../components/EngineerProfilePanel';
import DeploymentModal from '../components/DeploymentModal';

const AVAILABILITY_STYLES = {
    'Available': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Available' },
    'On Assignment': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'On Assignment' },
    'On Leave': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'On Leave' },
    'Off Duty': { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400', label: 'Off Duty' }
};

const SKILLS_COLORS = {
    'Solar': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Wiring': 'bg-blue-100 text-blue-700 border-blue-200',
    'CCTV': 'bg-purple-100 text-purple-700 border-purple-200',
    'Inverter': 'bg-green-100 text-green-700 border-green-200',
    'Battery': 'bg-orange-100 text-orange-700 border-orange-200',
    'default': 'bg-slate-100 text-slate-600 border-slate-200'
};

const EngineerCard = ({ member, onViewProfile, onDeploy, canWrite, onDelete }) => {
    const availability = member.availability || 'Available';
    const style = AVAILABILITY_STYLES[availability] || AVAILABILITY_STYLES['Available'];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-premium-blue-200 transition-all duration-300 group">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-premium-blue-500 to-premium-blue-700 text-white flex items-center justify-center text-xl font-bold shadow-lg">
                        {member.name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <h3 className="font-bold text-premium-blue-900 group-hover:text-premium-blue-700 transition-colors">
                            {member.name}
                        </h3>
                        <p className="text-sm text-premium-gold-600 font-medium">{member.role || 'Engineer'}</p>
                    </div>
                </div>
                <div className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
                    style.bg, style.text
                )}>
                    <span className={clsx('w-2 h-2 rounded-full animate-pulse', style.dot)} />
                    {style.label}
                </div>
            </div>

            {/* Skills */}
            {member.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {member.skills.slice(0, 3).map(skill => (
                        <span
                            key={skill}
                            className={clsx(
                                'px-2 py-0.5 rounded-md text-[10px] font-semibold border',
                                SKILLS_COLORS[skill] || SKILLS_COLORS['default']
                            )}
                        >
                            {skill}
                        </span>
                    ))}
                    {member.skills.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500">
                            +{member.skills.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1">
                    <Briefcase size={12} className="text-slate-400" />
                    <span>{member.completedDeployments || 0} jobs</span>
                </div>
                {member.rating > 0 && (
                    <div className="flex items-center gap-1">
                        <Award size={12} className="text-premium-gold-500" />
                        <span>{member.rating}/5</span>
                    </div>
                )}
                {member.dept && (
                    <div className="text-slate-400">{member.dept}</div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={() => onViewProfile(member)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                    <Eye size={16} /> View
                </button>
                {availability === 'Available' && canWrite && (
                    <button
                        onClick={() => onDeploy(member)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-premium-blue-900 text-white rounded-xl text-sm font-medium hover:bg-premium-blue-800 transition-colors shadow-lg shadow-premium-blue-900/20"
                    >
                        <Briefcase size={16} /> Deploy
                    </button>
                )}
                {canWrite && (
                    <button
                        onClick={() => onDelete(member)}
                        className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                        title="Delete team member"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default function TeamsList() {
    const { teamMembers, engineers, loading, stats, canWrite, removeMember } = useTeams();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
    const [selectedEngineer, setSelectedEngineer] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('all');
    const [skillFilter, setSkillFilter] = useState('all');
    const [viewMode, setViewMode] = useState('engineers'); // 'engineers' | 'all'

    // Get members based on view mode
    const displayMembers = viewMode === 'engineers' ? engineers : teamMembers;

    // Filter members
    const filteredMembers = useMemo(() => {
        if (!displayMembers) return [];

        return displayMembers.filter(m => {
            // Search
            const matchesSearch =
                m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

            // Availability filter
            const memberAvailability = m.availability || 'Available';
            const matchesAvailability =
                availabilityFilter === 'all' ||
                memberAvailability === availabilityFilter;

            // Skill filter
            const matchesSkill =
                skillFilter === 'all' ||
                m.skills?.includes(skillFilter);

            return matchesSearch && matchesAvailability && matchesSkill;
        });
    }, [displayMembers, searchQuery, availabilityFilter, skillFilter]);

    // Get unique skills for filter
    const allSkills = useMemo(() => {
        const skills = new Set();
        teamMembers?.forEach(m => m.skills?.forEach(s => skills.add(s)));
        return Array.from(skills);
    }, [teamMembers]);

    const handleViewProfile = (member) => {
        setSelectedEngineer(member);
        setIsProfileOpen(true);
    };

    const handleDeploy = useCallback((member) => {
        setSelectedEngineer(member);
        setIsDeployModalOpen(true);
    }, []);

    const handleDelete = useCallback(async (member) => {
        if (!window.confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
            return;
        }

        try {
            await removeMember(member.id);
        } catch (err) {
            console.error('Delete failed:', err);
            toast.error('Failed to delete team member');
        }
    }, [removeMember]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-premium-blue-900 tracking-tight">Engineer Command Center</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold border border-emerald-100 italic">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Live Sync Active
                        </span>
                        <p className="text-sm text-slate-500">Manage your technical workforce and scheduled deployments.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/teams/calendar')}
                        className="px-4 py-2 bg-white text-premium-blue-600 border border-premium-blue-100 rounded-xl text-sm font-medium hover:bg-premium-blue-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Calendar size={18} /> View Scheduler
                    </button>
                    {canWrite && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-premium-blue-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20 flex items-center gap-2"
                        >
                            <Plus size={18} /> Add Team Member
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Users size={24} className="text-slate-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                        <div className="text-xs text-slate-500">Total Engineers</div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-emerald-100 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <UserCheck size={24} className="text-emerald-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-emerald-600">{stats.available}</div>
                        <div className="text-xs text-slate-500">Available</div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Briefcase size={24} className="text-blue-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-blue-600">{stats.onAssignment}</div>
                        <div className="text-xs text-slate-500">On Assignment</div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-amber-100 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Clock size={24} className="text-amber-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-amber-600">{stats.onLeave}</div>
                        <div className="text-xs text-slate-500">On Leave</div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap bg-white p-4 rounded-xl border border-slate-200 gap-4">
                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-premium-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search team members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl w-full max-w-md focus:ring-4 focus:ring-premium-blue-500/10 focus:border-premium-blue-500 transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* View Toggle */}
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('engineers')}
                        className={clsx(
                            'px-4 py-2 rounded-md text-sm font-medium transition-all',
                            viewMode === 'engineers'
                                ? 'bg-white text-premium-blue-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        )}
                    >
                        Engineers
                    </button>
                    <button
                        onClick={() => setViewMode('all')}
                        className={clsx(
                            'px-4 py-2 rounded-md text-sm font-medium transition-all',
                            viewMode === 'all'
                                ? 'bg-white text-premium-blue-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        )}
                    >
                        All Staff
                    </button>
                </div>

                {/* Availability Filter */}
                <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-lg bg-slate-50 border-none text-sm font-medium text-slate-600 focus:ring-2 focus:ring-premium-gold-400"
                >
                    <option value="all">All Status</option>
                    <option value="Available">Available</option>
                    <option value="On Assignment">On Assignment</option>
                    <option value="On Leave">On Leave</option>
                </select>

                {/* Skill Filter */}
                {allSkills.length > 0 && (
                    <select
                        value={skillFilter}
                        onChange={(e) => setSkillFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-lg bg-slate-50 border-none text-sm font-medium text-slate-600 focus:ring-2 focus:ring-premium-gold-400"
                    >
                        <option value="all">All Skills</option>
                        {allSkills.map(skill => (
                            <option key={skill} value={skill}>{skill}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <Skeleton className="h-64 rounded-2xl" count={8} />
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200 text-slate-400">
                    <Users size={48} className="mb-4 opacity-30" />
                    <p className="font-medium">No team members found.</p>
                    <p className="text-sm mt-1">Try adjusting your filters or add a new member.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMembers.map(member => (
                        <EngineerCard
                            key={member.id}
                            member={member}
                            onViewProfile={handleViewProfile}
                            onDeploy={handleDeploy}
                            onDelete={handleDelete}
                            canWrite={canWrite}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <CreateTeamMemberModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />

            <EngineerProfilePanel
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                engineer={selectedEngineer}
                onDeploy={(member) => {
                    setIsProfileOpen(false);
                    handleDeploy(member);
                }}
            />

            <DeploymentModal
                isOpen={isDeployModalOpen}
                onClose={() => {
                    setIsDeployModalOpen(false);
                    setSelectedEngineer(null);
                }}
                initialLeadId={selectedEngineer?.id}
            />
        </div>
    );
}
