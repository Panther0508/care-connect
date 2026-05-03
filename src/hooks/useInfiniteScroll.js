import { useEffect, useRef, useState } from 'react';

const useInfiniteScroll = (callback, hasMore) => {
  const [isFetching, setIsFetching] = useState(false);
  const sentinelRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          setIsFetching(true);
          callback().finally(() => setIsFetching(false));
        }
      },
      { threshold: 1.0 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [callback, hasMore, isFetching]);

  return { sentinelRef, isFetching };
};

export default useInfiniteScroll;