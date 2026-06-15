"use client";
import { fetchWithAuth } from "@/lib/apiFetch";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Users, Clapperboard, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  type: "contact" | "project" | "task";
  url: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const [resProjects, resContacts, resTasks] = await Promise.all([
          fetchWithAuth("http://localhost:8000/api/v1/projects/"),
          fetchWithAuth("http://localhost:8000/api/v1/contacts/"),
          fetchWithAuth("http://localhost:8000/api/v1/tasks/"),
        ]);

        let combined: SearchResult[] = [];
        
        if (resProjects.ok) {
          const projects = await resProjects.json();
          combined = combined.concat(projects.map((p: any) => ({
            id: p.id,
            title: p.title,
            type: "project",
            url: `/projects/${p.id}`
          })));
        }

        if (resContacts.ok) {
          const contacts = await resContacts.json();
          combined = combined.concat(contacts.map((c: any) => ({
            id: c.id,
            title: c.name,
            type: "contact",
            url: `/contacts`
          })));
        }

        if (resTasks.ok) {
          const tasks = await resTasks.json();
          combined = combined.concat(tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            type: "task",
            url: `/projects/${t.project_id}`
          })));
        }

        const q = query.toLowerCase();
        const filtered = combined.filter((item) => item.title.toLowerCase().includes(q)).slice(0, 8);
        setResults(filtered);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "contact": return <Users className="w-4 h-4 text-indigo-500" />;
      case "project": return <Clapperboard className="w-4 h-4 text-blue-500" />;
      case "task": return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      default: return <Search className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search contacts, projects, or tasks..."
          className="pl-10 bg-muted border border-border rounded-xl h-10 w-full text-sm font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          </div>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50">
          {results.length > 0 ? (
            <ul className="py-2">
              {results.map((result) => (
                <li
                  key={`${result.type}-${result.id}`}
                  className="px-4 py-2 hover:bg-muted cursor-pointer flex items-center gap-3 transition-colors"
                  onClick={() => handleSelect(result.url)}
                >
                  <div className="p-2 bg-muted rounded-lg">
                    {getIcon(result.type)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{result.title}</p>
                    <p className="text-xs font-medium text-muted-foreground capitalize">{result.type}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : !loading && (
            <div className="p-4 text-center text-sm font-medium text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
