import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Project, Task } from '../../types';
import * as api from '../../lib/api';
import { fetchProjects } from '../../lib/projects';

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website with modern design',
    color: 'bg-blue-100',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    members: [],
    tasksCount: 24,
    completedTasks: 18
  },
  {
    id: '2',
    name: 'Mobile App',
    description: 'Native mobile application for iOS and Android',
    color: 'bg-green-100',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-19'),
    members: [],
    tasksCount: 32,
    completedTasks: 12
  },
  {
    id: '3',
    name: 'API Integration',
    description: 'Third-party API integration and documentation',
    color: 'bg-purple-100',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-18'),
    members: [],
    tasksCount: 16,
    completedTasks: 14
  }
];

interface DashboardProps {
  onViewChange: (view: string) => void;
}

export function Dashboard({ onViewChange }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    projectsCount: 0,
    tasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, projectsData] = await Promise.all([
        api.fetchStats(),
        fetchProjects()
      ]);
      
      setStats(statsData);
      
      const convertedProjects: Project[] = projectsData.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        members: [],
        tasksCount: project.tasksCount,
        completedTasks: project.completedTasks
      }));
      
      setProjects(convertedProjects);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Listen for task updates to refresh stats
  useEffect(() => {
    const handleTaskUpdate = () => {
      loadDashboardData();
    };

    window.addEventListener('taskCreated', handleTaskUpdate);
    window.addEventListener('taskUpdated', handleTaskUpdate);

    return () => {
      window.removeEventListener('taskCreated', handleTaskUpdate);
      window.removeEventListener('taskUpdated', handleTaskUpdate);
    };
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <Button onClick={() => onViewChange('projects')}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search projects and tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: CheckCircle,
            label: 'Completed Tasks',
            value: stats.completedTasks,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          {
            icon: Clock,
            label: 'Pending Tasks',
            value: stats.pendingTasks,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50'
          },
          {
            icon: AlertCircle,
            label: 'Active Projects',
            value: stats.projectsCount,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            icon: TrendingUp,
            label: 'Completion Rate',
            value: `${stats.completionRate}%`,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
          }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <p className="text-sm text-gray-600">{metric.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
          <button 
            onClick={() => onViewChange('projects')}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            View all →
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <Card hover className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${project.color} flex items-center justify-center`}>
                    <div className="w-6 h-6 bg-gray-700 rounded-sm"></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {project.updatedAt.toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {project.completedTasks}/{project.tasksCount} tasks
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(project.completedTasks / project.tasksCount) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {Math.round((project.completedTasks / project.tasksCount) * 100)}%
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}