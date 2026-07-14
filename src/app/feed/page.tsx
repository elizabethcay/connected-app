import { NewPost } from "./new-post";

export default function FeedPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Feed</h1>
        <NewPost />
      </div>
      <p className="text-sm text-gray-600">
        Anyone can view the feed. Log in to post.
      </p>
    </div>
  );
}
