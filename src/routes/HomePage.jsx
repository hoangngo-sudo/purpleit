import { useEffect, useState, useRef, useCallback } from "react";
import Post from "../components/Post";
import { supabase } from '../utils/client';
import { isEdited } from '../utils/helpers';
import { useOutletContext, Link } from "react-router-dom";
import { useAuth } from '../contexts/useAuth';

const PAGE_SIZE = 10;

const HomePage = () => {
  const [searchInput, setSearchInput] = useOutletContext();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [upvotedSet, setUpvotedSet] = useState(new Set());

  const pageRef = useRef(0);
  const observerRef = useRef(null);
  const fetchVersionRef = useRef(0);
  const isLoadingMoreRef = useRef(false);

  // Fetch the set of post IDs the logged-in user has upvoted
  useEffect(() => {
    if (!user) { setUpvotedSet(new Set()); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from('upvotes')
          .select('post_id')
          .eq('user_id', user.id);
        setUpvotedSet(new Set((data || []).map((r) => r.post_id)));
      } catch { setUpvotedSet(new Set()); }
    })();
  }, [user]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset search on mount
  useEffect(() => {
    setSearchInput("");
  }, [setSearchInput]);

  // Core fetch function — takes explicit args to avoid stale closures
  const fetchPage = async (page, search, sort, isReset, version) => {
    if (!isReset) {
      if (isLoadingMoreRef.current) return;
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('posts')
        .select('*, profiles!posts_author_id_fkey(username, avatar_url)', { count: 'exact' });

      // Server-side search
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      // Server-side sort
      if (sort === 'vote') {
        query = query.order('upvotes', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      // Stale response guard — ignore if a newer fetch was triggered
      if (fetchVersionRef.current !== version) return;

      const newPosts = data || [];

      if (isReset) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setTotalCount(count || 0);
      setHasMore(newPosts.length === PAGE_SIZE);
      pageRef.current = page;
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      if (fetchVersionRef.current === version) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
      isLoadingMoreRef.current = false;
    }
  };

  // Reset and fetch page 0 when search or sort changes
  useEffect(() => {
    const version = ++fetchVersionRef.current;
    pageRef.current = 0;
    setPosts([]);
    setHasMore(true);
    fetchPage(0, debouncedSearch, sortBy, true, version);
  }, [debouncedSearch, sortBy]);

  // Load next page
  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !hasMore) return;
    fetchPage(pageRef.current + 1, debouncedSearch, sortBy, false, fetchVersionRef.current);
  }, [debouncedSearch, sortBy, hasMore]);

  // Sentinel callback ref — sets up IntersectionObserver on the sentinel element
  const sentinelRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    if (!node) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(node);
  }, [loadMore]);

  const handleSortByDate = () => {
    if (sortBy !== 'date') setSortBy('date');
  };

  const handleSortByVote = () => {
    if (sortBy !== 'vote') setSortBy('vote');
  };

  if (isLoading) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header and Stats */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="h3 mb-0">
              Community Posts
            </h1>
            <span className="badge bg-secondary fs-6">
              {totalCount} post{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <span className="fw-semibold">
              <i className="bi bi-filter-left me-2"></i>Sort by:
            </span>
            <div className="btn-group" role="group">
              <button 
                type="button" 
                className={`btn ${sortBy === 'date' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={handleSortByDate}
              >
                <i className="bi bi-clock me-2"></i>Newest
              </button>
              <button 
                type="button" 
                className={`btn ${sortBy === 'vote' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={handleSortByVote}
              >
                <i className="bi bi-arrow-up me-2"></i>Most Popular
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="row">
        <div className="col-12">
          {posts.length > 0 ? (
            <>
              {posts.map((item) => (
                <Post
                  key={item.slug}
                  slug={item.slug}
                  createdAt={item.created_at}
                  title={item.title}
                  upvotes={item.upvotes}
                  isEdited={isEdited(item)}
                  hasUpvoted={upvotedSet.has(item.slug)}
                  authorUsername={item.profiles?.username}
                  authorAvatarUrl={item.profiles?.avatar_url}
                  authorId={item.author_id}
                />
              ))}

              {/* Infinite scroll sentinel */}
              {hasMore && (
                <div
                  ref={sentinelRef}
                  className="d-flex justify-content-center py-4"
                  style={{ minHeight: '1px' }}
                >
                  {isLoadingMore && (
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Loading more...</span>
                    </div>
                  )}
                </div>
              )}

              {/* End of list */}
              {!hasMore && (
                <div className="text-center py-4 text-muted">
                  Made with love by Hoang
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="bi bi-inbox display-1 text-muted"></i>
              </div>
              <h3 className="text-muted">No posts found</h3>
              <p className="text-muted mb-4">
                {searchInput ? 
                  `No posts match "${searchInput}". Try a different search term.` : 
                  "Be the first to share something with the community!"
                }
              </p>
              {!searchInput && (
                <Link to="/purpleit/create" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>Create First Post
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;