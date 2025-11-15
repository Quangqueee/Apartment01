'use client';

import { useState, useEffect } from 'react';

type ClientFormattedDateProps = {
  date: { seconds: number; nanoseconds: number };
};

// Helper to format YYYY-MM-DD to DD/MM/YYYY
const formatDisplayDate = (isoDate: string) => {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return '';
  }
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

export default function ClientFormattedDate({ date }: ClientFormattedDateProps) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // This effect runs only on the client, after hydration
    if (date && typeof date.seconds === 'number') {
        const d = new Date(date.seconds * 1000);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        setFormattedDate(`${day}/${month}/${year}`);
    }
  }, [date]);

  // Initially, this might render empty and then update, which is fine for non-critical UI.
  // Or render a placeholder. For this case, returning the formatted date is fine.
  return <span>{formattedDate}</span>;
}
