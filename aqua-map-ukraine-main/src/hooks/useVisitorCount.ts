import { useState, useEffect } from 'react';

const API_URL = '/api/views';
const VISITOR_ID_KEY = 'app_visitor_id';

export const useVisitorCount = () => {
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        setTotalViews(data.count);
      } catch (error) {
        console.error('Failed to fetch view count:', error);
      }
    };

    const incrementViews = async () => {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ referrer: document.referrer }),
        });
        const data = await response.json();
        setTotalViews(data.count);
      } catch (error) {
        console.error('Failed to increment view count:', error);
      }
    };

    let visitorId = localStorage.getItem(VISITOR_ID_KEY);

    if (!visitorId) {
      visitorId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
      incrementViews();
    } else {
      fetchViews();
    }
  }, []);

  return totalViews;
};