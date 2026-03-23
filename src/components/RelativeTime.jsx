import { useState, useEffect } from 'react';
import { formatTime } from '../utils/helpers';

const getTickInterval = (time) => {
  const ageSeconds = (Date.now() - Date.parse(time)) / 1000;
  if (ageSeconds < 60) return 10_000;
  if (ageSeconds < 3600) return 30_000;
  if (ageSeconds < 86400) return 60_000;
  return 300_000;
};

const RelativeTime = ({ time }) => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    let timeoutId;

    const tick = () => {
      forceUpdate((n) => n + 1);
      timeoutId = setTimeout(tick, getTickInterval(time));
    };

    timeoutId = setTimeout(tick, getTickInterval(time));

    return () => clearTimeout(timeoutId);
  }, [time]);

  return <time dateTime={time}>{formatTime(time)}</time>;
};

export default RelativeTime;
