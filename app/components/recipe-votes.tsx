"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

interface RecipeVotesProps {
  recipeId: string;
  userId?: string;
}

interface VoteCounts {
  likes: number;
  thumbsUp: number;
  thumbsDown: number;
}

interface UserVotes {
  like: boolean;
  thumbsUp: boolean;
  thumbsDown: boolean;
}

export function RecipeVotes({ recipeId, userId }: RecipeVotesProps) {
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({ likes: 0, thumbsUp: 0, thumbsDown: 0 });
  const [userVotes, setUserVotes] = useState<UserVotes>({ like: false, thumbsUp: false, thumbsDown: false });
  const [loading, setLoading] = useState(false);

  // Fetch vote counts and user's votes
  useEffect(() => {
    async function fetchVotes() {
      try {
        // Fetch vote counts
        const { data: likes } = await supabase
          .from('recipe_votes')
          .select('*', { count: 'exact' })
          .eq('recipe_id', recipeId)
          .eq('vote_type', 'like');
        
        const { data: thumbsUp } = await supabase
          .from('recipe_votes')
          .select('*', { count: 'exact' })
          .eq('recipe_id', recipeId)
          .eq('vote_type', 'thumbs_up');
        
        const { data: thumbsDown } = await supabase
          .from('recipe_votes')
          .select('*', { count: 'exact' })
          .eq('recipe_id', recipeId)
          .eq('vote_type', 'thumbs_down');

        setVoteCounts({
          likes: likes?.length || 0,
          thumbsUp: thumbsUp?.length || 0,
          thumbsDown: thumbsDown?.length || 0
        });

        // Fetch user's votes if logged in
        if (userId) {
          const { data: userVoteData } = await supabase
            .from('recipe_votes')
            .select('vote_type')
            .eq('recipe_id', recipeId)
            .eq('user_id', userId);

          const userVotes = {
            like: userVoteData?.some(v => v.vote_type === 'like') || false,
            thumbsUp: userVoteData?.some(v => v.vote_type === 'thumbs_up') || false,
            thumbsDown: userVoteData?.some(v => v.vote_type === 'thumbs_down') || false
          };
          setUserVotes(userVotes);
        }
      } catch (error) {
        console.error('Error fetching votes:', error);
      }
    }

    fetchVotes();
  }, [recipeId, userId]);

  const handleVote = async (voteType: 'like' | 'thumbs_up' | 'thumbs_down', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userId) {
      alert('Please log in to vote');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const isVoted = userVotes[voteType as keyof UserVotes];
      
      if (isVoted) {
        // Remove vote
        await supabase
          .from('recipe_votes')
          .delete()
          .eq('recipe_id', recipeId)
          .eq('user_id', userId)
          .eq('vote_type', voteType);

        setVoteCounts(prev => ({
          ...prev,
          [voteType === 'like' ? 'likes' : voteType === 'thumbs_up' ? 'thumbsUp' : 'thumbsDown']: 
            prev[voteType === 'like' ? 'likes' : voteType === 'thumbs_up' ? 'thumbsUp' : 'thumbsDown'] - 1
        }));

        setUserVotes(prev => ({
          ...prev,
          [voteType]: false
        }));
      } else {
        // Remove any existing votes for this recipe by this user
        await supabase
          .from('recipe_votes')
          .delete()
          .eq('recipe_id', recipeId)
          .eq('user_id', userId);

        // Add new vote
        await supabase
          .from('recipe_votes')
          .insert({
            recipe_id: recipeId,
            user_id: userId,
            vote_type: voteType
          });

        // Update counts
        const newCounts = { ...voteCounts };
        if (voteType === 'like') {
          newCounts.likes += 1;
          if (userVotes.thumbsUp) newCounts.thumbsUp -= 1;
          if (userVotes.thumbsDown) newCounts.thumbsDown -= 1;
        } else if (voteType === 'thumbs_up') {
          newCounts.thumbsUp += 1;
          if (userVotes.like) newCounts.likes -= 1;
          if (userVotes.thumbsDown) newCounts.thumbsDown -= 1;
        } else if (voteType === 'thumbs_down') {
          newCounts.thumbsDown += 1;
          if (userVotes.like) newCounts.likes -= 1;
          if (userVotes.thumbsUp) newCounts.thumbsUp -= 1;
        }

        setVoteCounts(newCounts);

        setUserVotes({
          like: voteType === 'like',
          thumbsUp: voteType === 'thumbs_up',
          thumbsDown: voteType === 'thumbs_down'
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 text-sm">
      {/* Like Button */}
      <button
        onClick={(e) => handleVote('like', e)}
        disabled={loading}
        className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
          userVotes.like 
            ? 'bg-red-100 text-red-600' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Like"
      >
        <svg 
          className={`w-4 h-4 ${userVotes.like ? 'fill-current' : 'fill-none stroke-current'}`} 
          viewBox="0 0 24 24"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span>{voteCounts.likes}</span>
      </button>

      {/* Thumbs Up Button */}
      <button
        onClick={(e) => handleVote('thumbs_up', e)}
        disabled={loading}
        className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
          userVotes.thumbsUp 
            ? 'bg-green-100 text-green-600' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Thumbs Up"
      >
        <svg 
          className={`w-4 h-4 ${userVotes.thumbsUp ? 'fill-current' : 'fill-none stroke-current'}`} 
          viewBox="0 0 24 24"
        >
          <path d="M14 9V5a3 3 0 0 0-6 0v4a3 3 0 0 0-3 3v5a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-5a3 3 0 0 0-3-3z"/>
        </svg>
        <span>{voteCounts.thumbsUp}</span>
      </button>

      {/* Thumbs Down Button */}
      <button
        onClick={(e) => handleVote('thumbs_down', e)}
        disabled={loading}
        className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
          userVotes.thumbsDown 
            ? 'bg-red-100 text-red-600' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Thumbs Down"
      >
        <svg 
          className={`w-4 h-4 ${userVotes.thumbsDown ? 'fill-current' : 'fill-none stroke-current'}`} 
          viewBox="0 0 24 24"
        >
          <path d="M10 15v4a3 3 0 0 0 6 0v-4a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v5a3 3 0 0 0 3 3z"/>
        </svg>
        <span>{voteCounts.thumbsDown}</span>
      </button>
    </div>
  );
} 