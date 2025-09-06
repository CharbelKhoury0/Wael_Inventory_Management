import React from 'react';
import { Package, Truck, Container, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useTheme } from '../App';

const DashboardCards: React.FC = () => {
  const { isDark } = useTheme();
  const cards = [
    {
      title: 'Total Items',
      value: '1,247',
      change: '+12%',
      changeType: 'positive',
      icon: Package,
      color: 'blue',
      description: 'Items in inventory'
    },
    {
      title: 'Incoming Trucks',
      value: '8',
      change: '+3',
      changeType: 'positive',
      icon: Truck,
      color: 'green',
      description: 'Scheduled today'
    },
    {
      title: 'Outgoing Containers',
      value: '12',
      change: '-2',
      changeType: 'neutral',
      icon: Container,
      color: 'orange',
      description: 'Pending shipment'
    },
    {
      title: 'Low Stock Alerts',
      value: '23',
      change: '+5',
      changeType: 'negative',
      icon: AlertCircle,
      color: 'red',
      description: 'Require attention'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500 text-blue-600 bg-blue-50';
      case 'green':
        return 'bg-green-500 text-green-600 bg-green-50';
      case 'orange':
        return 'bg-orange-500 text-orange-600 bg-orange-50';
      case 'red':
        return 'bg-red-500 text-red-600 bg-red-50';
      default:
        return 'bg-gray-500 text-gray-600 bg-gray-50';
    }
  };

  const getChangeClasses = (type: string) => {
    if (isDark) {
      switch (type) {
        case 'positive':
          return 'text-green-400 bg-green-900/30';
        case 'negative':
          return 'text-red-400 bg-red-900/30';
        default:
          return 'text-gray-400 bg-gray-800/30';
      }
    } else {
      switch (type) {
        case 'positive':
          return 'text-green-600 bg-green-50';
        case 'negative':
          return 'text-red-600 bg-red-50';
        default:
          return 'text-gray-600 bg-gray-50';
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const colorClasses = getColorClasses(card.color).split(' ');
        const iconBg = colorClasses[0];
        const textColor = colorClasses[1];
        const cardBg = colorClasses[2];
        
        return (
          <div key={index} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow duration-200`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${iconBg}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className={`px-2 py-1 rounded-md text-xs font-medium ${getChangeClasses(card.changeType)}`}>
                {card.change}
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{card.value}</h3>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{card.title}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardCards;