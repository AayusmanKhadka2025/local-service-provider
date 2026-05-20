import { useState, useEffect } from "react";
import axios from "axios";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Banknote,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const ProviderEarning = () => {
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    averagePerJob: 0,
    totalCompletedJobs: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // all, this_month, last_month
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const provider = JSON.parse(localStorage.getItem("provider") || "{}");
  const token = localStorage.getItem("providerToken");

  // Fetch provider bookings and calculate earnings
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "http://localhost:5050/api/bookings/provider",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          const bookingsData = response.data.bookings;
          
          // Calculate earnings from completed bookings
          const completedBookings = bookingsData.completed || [];
          
          // Get current date for calculations
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          
          // Calculate this month's start and end dates
          const thisMonthStart = new Date(currentYear, currentMonth, 1);
          const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0);
          
          // Calculate last month's start and end dates
          const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
          const lastMonthEnd = new Date(currentYear, currentMonth, 0);
          
          let totalEarnings = 0;
          let thisMonthEarnings = 0;
          let lastMonthEarnings = 0;
          const transactionList = [];
          
          completedBookings.forEach((booking) => {
            const amount = booking.calculatedAmount || booking.totalAmount;
            const bookingDate = new Date(booking.completedAt || booking.updatedAt || booking.createdAt);
            
            // Add to total earnings
            totalEarnings += amount;
            
            // Check if booking belongs to this month
            if (bookingDate >= thisMonthStart && bookingDate <= thisMonthEnd) {
              thisMonthEarnings += amount;
            }
            
            // Check if booking belongs to last month
            if (bookingDate >= lastMonthStart && bookingDate <= lastMonthEnd) {
              lastMonthEarnings += amount;
            }
            
            // Add to transaction list
            transactionList.push({
              id: booking._id,
              amount: amount,
              service: booking.service,
              clientName: booking.user.name,
              date: bookingDate,
              status: booking.status,
              duration: booking.duration,
              hourlyRate: booking.provider.hourlyRate,
              transactionId: booking._id.slice(-8).toUpperCase(),
            });
          });
          
          // Sort transactions by date (newest first)
          transactionList.sort((a, b) => b.date - a.date);
          
          const totalCompletedJobs = completedBookings.length;
          const averagePerJob = totalCompletedJobs > 0 ? totalEarnings / totalCompletedJobs : 0;
          
          setEarnings({
            totalEarnings,
            thisMonthEarnings,
            lastMonthEarnings,
            averagePerJob,
            totalCompletedJobs,
          });
          
          setTransactions(transactionList);
        }
      } catch (error) {
        console.error("Error fetching earnings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEarnings();
  }, [token]);

  // Filter transactions based on selected filter
  const getFilteredTransactions = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0);
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0);
    
    switch (filterType) {
      case "this_month":
        return transactions.filter(t => t.date >= thisMonthStart && t.date <= thisMonthEnd);
      case "last_month":
        return transactions.filter(t => t.date >= lastMonthStart && t.date <= lastMonthEnd);
      default:
        return transactions;
    }
  };
  
  const filteredTransactions = getFilteredTransactions();
  const displayedTransactions = showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 5);
  const hasMoreTransactions = filteredTransactions.length > 5;

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-NP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Stats cards configuration matching the dashboard style
  const stats = [
    {
      label: "Total Earnings",
      value: formatCurrency(earnings.totalEarnings),
      icon: Wallet,
      color: "green",
      subtext: `From ${earnings.totalCompletedJobs} completed jobs`
    },
    {
      label: "This Month",
      value: formatCurrency(earnings.thisMonthEarnings),
      icon: Calendar,
      color: "blue",
      subtext: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`
    },
    {
      label: "Last Month",
      value: formatCurrency(earnings.lastMonthEarnings),
      icon: Clock,
      color: "purple",
      subtext: `${new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('default', { month: 'long' })}`
    },
    {
      label: "Average per Job",
      value: formatCurrency(earnings.averagePerJob),
      icon: Banknote,
      color: "orange",
      subtext: `Based on ${earnings.totalCompletedJobs} jobs`
    },
  ];

  // Color mappings for gradient backgrounds (matching dashboard stats)
  const getColorStyles = (color) => {
    const colors = {
      green: "from-green-500 to-green-400",
      blue: "from-blue-500 to-blue-400",
      purple: "from-purple-500 to-purple-400",
      orange: "from-orange-500 to-orange-400",
      yellow: "from-yellow-500 to-yellow-400",
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid - Same style as dashboard stats cards */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6">Earnings Overview</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const gradientColor = getColorStyles(stat.color);
            return (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group"
              >
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${gradientColor} rounded-xl flex items-center justify-center shadow-lg mb-3 md:mb-4 transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <p className="text-xs md:text-sm text-gray-500">
                  {stat.label}
                </p>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mt-1">
                  {stat.value}
                </h2>
                <p className="text-xs text-gray-400 mt-2">
                  {stat.subtext}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Transaction History</h3>
                <p className="text-sm text-gray-500">All your completed payments</p>
              </div>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filterType === "all"
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setFilterType("this_month")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filterType === "this_month"
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setFilterType("last_month")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filterType === "last_month"
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Last Month
              </button>
            </div>
          </div>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-700 mb-2">No transactions yet</h4>
            <p className="text-sm text-gray-500">
              Complete bookings to start earning and see your transaction history here.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Transaction ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Client</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Service</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Duration</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTransactions.map((transaction, index) => (
                    <tr
                      key={transaction.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-600">
                          #{transaction.transactionId}
                        </span>
                       </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{formatDate(transaction.date)}</span>
                       </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-800">{transaction.clientName}</span>
                       </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{transaction.service}</span>
                       </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {transaction.duration ? `${transaction.duration.toFixed(2)} hrs` : 'N/A'}
                        </span>
                       </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-green-600">
                          +{formatCurrency(transaction.amount)}
                        </span>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Show More / Show Less Button */}
            {hasMoreTransactions && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => setShowAllTransactions(!showAllTransactions)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 hover:translate-x-1"
                >
                  {showAllTransactions ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      View All Transactions ({filteredTransactions.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Summary Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Earnings Summary
            </h4>
            <p className="text-sm text-gray-600">
              You have completed <span className="font-bold text-blue-600">{earnings.totalCompletedJobs}</span> jobs
              and earned a total of <span className="font-bold text-green-600">{formatCurrency(earnings.totalEarnings)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProviderEarning;