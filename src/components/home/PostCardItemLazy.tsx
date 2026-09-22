import React, { useEffect, useRef, useState } from "react";
import { PostCardItem, Post } from "./PostCardItem";

/**
 * Defers mounting a PostCardItem until its placeholder scrolls close to the
 * viewport (or focus approaches it). Keeps first paint of long rails cheap on
 * low-end devices and Android TV without breaking spatial navigation, since
 * focusable mounting swaps to the real card as the user approaches.
 */
export const PostCardItemLazy: React.FC<{
  post: Post;
  focusKey: string;
  onClick: (post: Post) => void;
  onRemove?: (post: Post, e?: any) => void;
}> = ({ post, focusKey, onClick, onRemove }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      {visible ? (
        <PostCardItem post={post} focusKey={focusKey} onClick={onClick} onRemove={onRemove} />
      ) : (
        <div className="post-card post-card-placeholder" aria-hidden="true" />
      )}
    </div>
  );
};

export default PostCardItemLazy;
