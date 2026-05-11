// src/services/communityEngine.js
// Community Features - Community Health Forum
// Uses native IndexedDB (no external dependencies)

import { openDB } from '../lib/idb';
const DB_NAME = 'vitachain-community';
const DB_VERSION = 1;

let dbInstance = null;

// Open community database
// Initialize community database (noop - openDB handles initialization)
const initCommunityDB = async () => {
  return openDB();
};

// Topic categories
export const TOPICS = [
  { id: 'hypertension', name: 'Managing Hypertension', postCount: 0 },
  { id: 'diabetes', name: 'Diabetes Support', postCount: 0 },
  { id: 'maternal', name: 'Maternal Health', postCount: 0 },
  { id: 'mental', name: 'Mental Wellness', postCount: 0 },
  { id: 'fitness', name: 'Fitness & Exercise', postCount: 0 },
  { id: 'nutrition', name: 'Nutrition Tips', postCount: 0 },
  { id: 'medication', name: 'Medication Adherence', postCount: 0 },
  { id: 'pain', name: 'Living with Chronic Pain', postCount: 0 },
  { id: 'caregiving', name: 'Caregiving Support', postCount: 0 },
  { id: 'newparents', name: 'First-Time Parents', postCount: 0 },
  { id: 'menopause', name: 'Menopause Journey', postCount: 0 },
  { id: 'general', name: 'General Health Q&A', postCount: 0 }
];

// Create a new post
export const createPost = async (authorId, topic, content) => {
  const db = await initCommunityDB();

  const post = {
    authorId,
    topic,
    content,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const tx = db.transaction('posts', 'readwrite');
  const store = tx.objectStore('posts');
  const id = await store.add(post);
  await tx.done;

  return { ...post, id };
};

// Get posts for a topic
export const getPosts = async (topic, limit = 10, offset = 0) => {
  const db = await initCommunityDB();
  const tx = db.transaction('posts', 'readonly');
  const store = tx.objectStore('posts');

  let posts;
  if (topic) {
    const index = store.index('topic');
    const request = index.getAll(IDBKeyRange.only(topic));
    posts = await new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  } else {
    const request = store.getAll();
    posts = await new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }

  // Sort by newest first and apply pagination
  const sorted = posts
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(offset, offset + limit)
    .map(post => ({
      ...post,
      commentCount: post.comments?.length || 0,
      likeCount: post.likes?.length || 0
    }));

  return sorted;
};

// Like a post
export const likePost = async (postId, userId) => {
  const db = await initCommunityDB();
  const tx = db.transaction('posts', 'readwrite');
  const store = tx.objectStore('posts');
  const request = store.get(postId);

  const post = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

  if (!post) throw new Error('Post not found');

  const hasLiked = post.likes?.includes(userId) || false;

  if (hasLiked) {
    post.likes = post.likes.filter(id => id !== userId);
  } else {
    post.likes = [...(post.likes || []), userId];
  }

  post.updatedAt = new Date().toISOString();
  const updateRequest = store.put(post);
  await new Promise((resolve) => {
    updateRequest.onsuccess = () => resolve();
    updateRequest.onerror = () => reject(updateRequest.error);
  });
  await tx.done;

  return post;
};

// Add a comment to a post
export const addComment = async (postId, authorId, text) => {
  const db = await initCommunityDB();

  const comment = {
    postId,
    authorId,
    text,
    createdAt: new Date().toISOString()
  };

  // Add to comments store
  const commentTx = db.transaction('comments', 'readwrite');
  const commentStore = commentTx.objectStore('comments');
  const commentId = await commentStore.add(comment);
  await commentTx.done;

  // Update post's comments array
  const postTx = db.transaction('posts', 'readwrite');
  const postStore = postTx.objectStore('posts');
  const postRequest = postStore.get(postId);
  const post = await new Promise((resolve) => {
    postRequest.onsuccess = () => resolve(postRequest.result);
    postRequest.onerror = () => resolve(null);
  });

  if (!post) throw new Error('Post not found');

  post.comments = [...(post.comments || []), { ...comment, id: commentId }];
  post.updatedAt = new Date().toISOString();
  await postStore.put(post);
  await postTx.done;

  return post;
};

// Get all topics with post counts
export const getTopics = async () => {
  const db = await initCommunityDB();
  const topics = [...TOPICS]; // Copy to avoid mutating original

  // Get post counts for each topic
  const tx = db.transaction('posts', 'readonly');
  const store = tx.objectStore('posts');

  for (const topic of topics) {
    const index = store.index('topic');
    const countRequest = index.count(IDBKeyRange.only(topic.id));
    topic.postCount = await new Promise((resolve) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => resolve(0);
    });
  }

  await tx.done;
  return topics;
};

// Search posts by query
export const searchPosts = async (query, limit = 10) => {
  const db = await initCommunityDB();
  const tx = db.transaction('posts', 'readonly');
  const store = tx.objectStore('posts');
  const request = store.getAll();

  const posts = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });

  // Simple text search
  const filtered = posts
    .filter(post =>
      post.content.toLowerCase().includes(query.toLowerCase()) ||
      post.topic.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map(post => ({
      ...post,
      commentCount: post.comments?.length || 0,
      likeCount: post.likes?.length || 0
    }));

  return filtered;
};

// Report a post
export const reportPost = async (postId, reason) => {
  const db = await initCommunityDB();
  const tx = db.transaction('posts', 'readwrite');
  const store = tx.objectStore('posts');
  const request = store.get(postId);

  const post = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

  if (!post) throw new Error('Post not found');

  post.reported = true;
  post.reportReason = reason;
  post.reportTimestamp = new Date().toISOString();

  await store.put(post);
  await tx.done;

  return post;
};

// Delete a post (only by author)
export const deletePost = async (postId, authorId) => {
  const db = await initCommunityDB();
  const tx = db.transaction('posts', 'readwrite');
  const store = tx.objectStore('posts');
  const request = store.get(postId);

  const post = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

  if (!post) throw new Error('Post not found');
  if (post.authorId !== authorId) {
    throw new Error('Unauthorized');
  }

  await store.delete(postId);

  // Also delete associated comments
  const commentTx = db.transaction('comments', 'readwrite');
  const commentStore = commentTx.objectStore('comments');
  const commentsRequest = store.index('postId').getAll(postId);
  const comments = await new Promise((resolve) => {
    commentsRequest.onsuccess = () => resolve(commentsRequest.result);
    commentsRequest.onerror = () => resolve([]);
  });

  for (const comment of comments) {
    await commentStore.delete(comment.id);
  }
  await commentTx.done;

  await tx.done;
};

export default {
  initCommunityDB,
  TOPICS,
  createPost,
  getPosts,
  likePost,
  addComment,
  getTopics,
  searchPosts,
  reportPost,
  deletePost
};
