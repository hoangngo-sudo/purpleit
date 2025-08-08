import { useEffect, useState } from "react";
import Post from "../components/Post";
import { supabase } from '../utils/client';
import { useOutletContext, Link } from "react-router-dom";

const HomePage = () => {
  const [searchInput, setSearchInput] = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSearchInput("");
    fetchPosts().catch(console.error);
  }, [setSearchInput]);

  useEffect(() => {
    searchPosts();
  }, [searchInput, posts]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const {data} = await supabase
        .from('posts')
        .select()
        .order('created_at', { ascending: false });

      setPosts(data || []);
      setFilteredPosts(data || []);
      setSortBy('date');
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchPosts = () => {
    if (searchInput !== "") {
      const filteredResults = posts.filter((item) =>
        item.title.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredPosts(filteredResults);
    } else {
      setFilteredPosts(posts);
    }
  };

  const sortPostsByDate = () => {
    const temp = [...filteredPosts].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    setFilteredPosts(temp);
    setSortBy('date');
  };

  const sortPostsByVote = () => {
    const temp = [...filteredPosts].sort((a, b) => parseInt(b.upvotes) - parseInt(a.upvotes));
    setFilteredPosts(temp);
    setSortBy('vote');
  };

  const formatTime = (time) => {
    let postedTime = (Date.now() - Date.parse(time))/1000;

    if (postedTime <= 60)
      return `${Math.floor(postedTime)} seconds`;
    if (postedTime <= 60*60)
      return `${Math.floor(postedTime/60)} minutes`;
    if (postedTime <= 60*60*24)
      return `${Math.floor(postedTime/(60*60))} hours`;
    if (postedTime <= 60*60*24*7)
      return `${Math.floor(postedTime/(60*60*24))} days`;
    if (postedTime <= 60*60*24*30)
      return `${Math.floor(postedTime/(60*60*24*7))} weeks`;
    if (postedTime <= 60*60*24*7*52)
      return `${Math.floor(postedTime/(60*60*24*30))} months`;
    if (postedTime > 60*60*24*7*52)
      return `${Math.floor(postedTime/(60*60*24*7*52))} years`;
  };

  const isEdited = (post) => {
    // Check if updated_at exists and is different from created_at
    return post.updated_at && 
      new Date(post.updated_at).getTime() > new Date(post.created_at).getTime();
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
              {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center">
            <span className="me-3 fw-semibold">
              <i className="bi bi-sort-down me-2"></i>Sort by:
            </span>
            <div className="btn-group" role="group">
              <button 
                type="button" 
                className={`btn ${sortBy === 'date' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={sortPostsByDate}
              >
                <i className="bi bi-clock me-2"></i>Newest
              </button>
              <button 
                type="button" 
                className={`btn ${sortBy === 'vote' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={sortPostsByVote}
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
          {filteredPosts && filteredPosts.length > 0 ? (
            <div>
              {filteredPosts.map((item) => (
                <Post
                  key={item.user_id}
                  user_id={item.user_id}
                  time={formatTime(item.created_at)}
                  title={item.title}
                  upvotes={item.upvotes}
                  isEdited={isEdited(item)}
                />
              ))}
            </div>
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