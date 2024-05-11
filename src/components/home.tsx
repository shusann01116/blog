import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";

export function Home() {
  const router = useRouter();

  const navigateToAbout = () => {
    router.push("/about");
  };
  const navigateToPosts = () => {
    router.push("/blog");
  };

  return (
    <div className="flex flex-col grow items-center justify-center h-screen mx-4">
      <h1 className="text-4xl font-bold mb-6">Welcome to shusann's Blog</h1>
      <p className="text-xl mb-8">
        Dive into a world of thoughts and discoveries.
      </p>
      <div className="flex justify-center gap-4">
        <Button onClick={navigateToAbout}>About Me</Button>
        <Button onClick={navigateToPosts}>Blog Posts</Button>
      </div>
    </div>
  );
}
