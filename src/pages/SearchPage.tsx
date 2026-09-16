import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LuSearch as Search, LuX as X, LuTv as Tv, LuFilm as Film } from "react-icons/lu";
import { useGlobalSearch } from "../lib/hooks/useGlobalSearch";
import { PostCardItem } from "../components/home/PostCardItem";
import { FocusableButton } from "../components/layout/FocusableButton";
import { Spinner } from "../components/ui/spinner";
import { FocusContext, useFocusable } from "@noriginmedia/norigin-spatial-navigation-react";
import { resume, setFocus } from "@noriginmedia/norigin-spatial-navigation-core";
import { fetchIMDbSuggestions, type IMDbSuggestion } from "../lib/services/imdbSuggestions";
import { settingsStorage } from "../lib/storage";
import type { Post } from "../lib/providers/types";
import "./SearchPage.css";

const FocusableSuggestionItem: React.FC<{
  item: IMDbSuggestion;
  focusKey: string;
  onSelect: (title: string) => void;
  tvMode: boolean;
}> = ({ item, focusKey, onSelect, tvMode }) => {
  const { ref, focused } = useFocusable({
    focusable: tvMode,
    focusKey,
    onEnterPress: () => {
      onSelect(item.title);
    },
    onFocus: (layout) => {
      layout.node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
  });

  return (
    <button
      ref={ref as any}
      type="button"
      className={`search-suggestion-item ${focused ? "tv-focus" : ""}`}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(item.title);
      }}
      onClick={() => onSelect(item.title)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(item.title);
        }
      }}
    >
      <div className="search-suggestion-content">
        {item.type === "tv" ? (
          <Tv size={16} className="search-suggestion-icon" />
        ) : (
          <Film size={16} className="search-suggestion-icon" />
        )}
        <span className="search-suggestion-title">{item.title}</span>
      </div>
    </button>
  );
};

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const [localQuery, setLocalQuery] = useState(query);
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<IMDbSuggestion[]>([]);

  const nativeInputRef = useRef<HTMLInputElement>(null);
  const navigatingToSuggestionsRef = useRef(false);
  const suppressSuggestionsRef = useRef(true);
  const isAndroid = navigator.userAgent.toLowerCase().includes("android");
  const tvMode = settingsStorage.isTvModeEnabled() || isAndroid;
  const {
    ref: searchFocusRef,
    focused: searchFocused,
    focusSelf: focusSearch,
  } = useFocusable({
    focusable: tvMode,
    onEnterPress: () => {
      setIsTyping(true);
      window.setTimeout(() => nativeInputRef.current?.focus(), 0);
    },
  });

  const { ref: suggestionsContainerRef, focusKey: suggestionsFocusKey } =
    useFocusable({
      focusable: false,
      trackChildren: true,
    });

  const { mergedPosts, emptyResults, loading, isAllLoaded } =
    useGlobalSearch(query);

  const [hideNSFW, setHideNSFW] = useState(true);

  const NSFW_KEYWORDS = /\b(porn|xxx|sex|nude|naked|erotic|adult|18\+|uncensored|hentai|leaked|mms|scandal|bf|gf|hot|sexy|desi\s*mms)\b/i;

  const { exactPosts, similarPosts } = useMemo(() => {
    if (!query.trim()) return { exactPosts: mergedPosts, similarPosts: [] };
    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);
    const exact: Post[] = [];
    const similar: Post[] = [];
    for (const post of mergedPosts) {
      const title = (post.title || "").toLowerCase();
      const isExact = words.some((w) => title.includes(w));
      if (isExact) exact.push(post);
      else similar.push(post);
    }
    return { exactPosts: exact, similarPosts: similar };
  }, [mergedPosts, query]);

  const filteredExact = useMemo(
    () => (hideNSFW ? exactPosts.filter((p) => !NSFW_KEYWORDS.test(p.title)) : exactPosts),
    [exactPosts, hideNSFW],
  );
  const filteredSimilar = useMemo(
    () => (hideNSFW ? similarPosts.filter((p) => !NSFW_KEYWORDS.test(p.title)) : similarPosts),
    [similarPosts, hideNSFW],
  );

  useEffect(() => {
    suppressSuggestionsRef.current = true;
    setLocalQuery(query);
  }, [query]);

  // Debounced IMDb search suggestions
  useEffect(() => {
    const clean = localQuery.trim();
    if (clean.length < 3 || suppressSuggestionsRef.current) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const results = await fetchIMDbSuggestions(clean, controller.signal);
      setSuggestions(results);
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [localQuery]);

  const submitSearch = () => {
    suppressSuggestionsRef.current = true;
    setSuggestions([]);
    if (localQuery.trim()) {
      nativeInputRef.current?.blur();
      navigate(`/search?q=${encodeURIComponent(localQuery.trim())}`);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    submitSearch();
  };

  const clearSearch = () => {
    suppressSuggestionsRef.current = false;
    setLocalQuery("");
    setSuggestions([]);
    navigate("/search");
    nativeInputRef.current?.focus();
  };

  const stopTyping = () => {
    setIsTyping(false);
    window.setTimeout(() => {
      resume();
      focusSearch();
    }, 0);
  };

  const handleSelectSuggestion = (title: string) => {
    suppressSuggestionsRef.current = true;
    setLocalQuery(title);
    if (nativeInputRef.current) {
      nativeInputRef.current.value = title;
    }
    setSuggestions([]);
    if (tvMode) {
      resume();
      focusSearch();
    } else {
      nativeInputRef.current?.focus();
    }
  };

  const hasAnyResults = mergedPosts.length > 0;
  const isCurrentlyLoading = loading.some((l) => l.isLoading);
  const showSuggestions =
    (isInputFocused || isTyping) &&
    localQuery.trim().length >= 3 &&
    suggestions.length > 0;

  return (
    <div className="search-page">
      <div className="search-page-header-container">
        <div className="search-page-form-wrapper">
          <form className="search-page-form" onSubmit={handleSearch}>
            <div
              ref={searchFocusRef}
              className={`search-page-form-inner ${searchFocused ? "tv-focus" : ""}`}
              onClick={() => {
                setIsTyping(true);
                window.setTimeout(() => nativeInputRef.current?.focus(), 0);
              }}
            >
              <Search size={23} className="search-page-icon" aria-hidden="true" />
              <input
                ref={nativeInputRef}
                type="text"
                placeholder="Search all providers..."
                aria-label="Search all providers"
                className="search-page-input"
                tabIndex={tvMode ? -1 : 0}
                readOnly={tvMode ? !isTyping : false}
                value={localQuery}
                onChange={(event) => {
                  suppressSuggestionsRef.current = false;
                  setLocalQuery(event.target.value);
                }}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => {
                  if (navigatingToSuggestionsRef.current) {
                    navigatingToSuggestionsRef.current = false;
                    return;
                  }
                  stopTyping();
                  setTimeout(() => setIsInputFocused(false), 200);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "ArrowDown" && showSuggestions && tvMode) {
                    e.preventDefault();
                    navigatingToSuggestionsRef.current = true;
                    setIsTyping(false);
                    nativeInputRef.current?.blur();
                    window.setTimeout(() => {
                      resume();
                      setFocus("suggestion-item-0");
                    }, 0);
                    return;
                  }
                  if (
                    e.key === "Escape" ||
                    e.key === "ArrowDown" ||
                    e.key === "ArrowUp"
                  ) {
                    e.preventDefault();
                    nativeInputRef.current?.blur();
                  }
                }}
                autoFocus={!tvMode}
              />
              {localQuery && (
                <button
                  type="button"
                  className="search-page-clear"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  <X size={19} />
                </button>
              )}
            </div>
            <FocusableButton
              className="search-page-submit"
              onClick={submitSearch}
              disabled={!localQuery.trim()}
            >
              <Search size={19} aria-hidden="true" />
              <span>Search</span>
            </FocusableButton>
          </form>

          {showSuggestions && (
            <FocusContext.Provider value={suggestionsFocusKey}>
              <div
                ref={suggestionsContainerRef}
                className="search-suggestions-dropdown"
              >
                {suggestions.map((item, index) => (
                  <FocusableSuggestionItem
                    key={`${item.title}-${index}`}
                    item={item}
                    focusKey={`suggestion-item-${index}`}
                    onSelect={handleSelectSuggestion}
                    tvMode={tvMode}
                  />
                ))}
              </div>
            </FocusContext.Provider>
          )}
        </div>
        {isCurrentlyLoading && (
          <Spinner size={26} label="Searching providers" />
        )}
      </div>

      {!query ? (
        <div className="search-page-empty">
          <span className="search-empty-icon">
            <Search size={34} />
          </span>
          <h2 className="headline-lg">Discover content</h2>
          <p className="body-lg text-muted">
            Search across all installed providers from one place.
          </p>
        </div>
      ) : (
        <div className="search-results-meta">
          <p className="body-lg text-muted">
            {isAllLoaded ? "Searched for" : "Searching for"}{" "}
            <span className="text-primary">"{query}"</span>
          </p>
          <label className="nsfw-filter-toggle">
            <input
              type="checkbox"
              checked={hideNSFW}
              onChange={(e) => setHideNSFW(e.target.checked)}
            />
            <span>18+ off</span>
          </label>
        </div>
      )}

      {query &&
        !isCurrentlyLoading &&
        !hasAnyResults &&
        emptyResults.length > 0 && (
          <div className="empty-state">
            <h2 className="headline-md">No results found</h2>
            <p className="body-lg text-muted">
              Try adjusting your search terms.
            </p>
          </div>
        )}

      {query && filteredExact.length > 0 && (
        <>
          <div className="search-section-header">
            <h3>Results for &quot;{query}&quot;</h3>
          </div>
          <div className="search-grid pb-xl">
            {filteredExact.map((post, index) => (
              <PostCardItem
                key={`exact-${post.link}-${index}`}
                post={post}
                onClick={() => {
                  const params = new URLSearchParams();
                  if (post.provider) params.append("provider", post.provider);
                  if (post.image) params.append("poster", post.image);
                  navigate(
                    `/content/${encodeURIComponent(post.link)}?${params.toString()}`,
                  );
                }}
              />
            ))}
          </div>
        </>
      )}

      {query && filteredSimilar.length > 0 && (
        <>
          <div className="search-section-header">
            <h3>Similar Results</h3>
          </div>
          <div className="search-grid pb-xl">
            {filteredSimilar.map((post, index) => (
              <PostCardItem
                key={`similar-${post.link}-${index}`}
                post={post}
                onClick={() => {
                  const params = new URLSearchParams();
                  if (post.provider) params.append("provider", post.provider);
                  if (post.image) params.append("poster", post.image);
                  navigate(
                    `/content/${encodeURIComponent(post.link)}?${params.toString()}`,
                  );
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
