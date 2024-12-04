export const formatDateRange = (dailyPlans) => {
    if (!dailyPlans || dailyPlans.length === 0) return '';
    
    const startDate = new Date(dailyPlans[0].date);
    const endDate = new Date(dailyPlans[dailyPlans.length - 1].date);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };
  
  export const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };
  
  export const getDayDifference = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };