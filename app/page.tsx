"use client";
import { useContext, useEffect, useState } from "react";
import type { Event, Filter, Relay } from "nostr-tools";
import Aside from "./Aside";
import BlogFeed from "./BlogFeed";
import Content from "./Content";
import { KeysContext } from "./context/keys-provider";
import Main from "./Main";
import RecommendedEvents from "./RecommendedEvents";
import Topics from "./Topics";
import Tabs from "./Tabs";
import { NostrService } from "./lib/nostr";
import { RelayContext } from "./context/relay-provider";
import FollowedRelays from "./FollowedRelays";
import { FeedContext } from "./context/feed-provider";
import { ProfilesContext } from "./context/profiles-provider";

export default function HomePage() {
  // @ts-ignore
  const { keys: loggedInUserKeys } = useContext(KeysContext);
  const exploreFilter = {
    kinds: [2222],
    limit: 50,
    authors: undefined,
    until: undefined,
  };
  const [exploreEvents, setExploreEvents] = useState<Event[]>([]);
  const [followingEvents, setFollowingEvents] = useState<Event[]>([]);
  const [followingFilter, setFollowingFilter] = useState<Filter>();
  // const [pubkeys, setpubkeys] = useState<string[]>();
  const TABS = ["Explore", "Following"];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);

  // @ts-ignore
  const { activeRelay, pendingActiveRelayUrl } = useContext(RelayContext);

  // @ts-ignore
  const { setpubkeys } = useContext(ProfilesContext);

  // @ts-ignore
  const { feed, setFeed } = useContext(FeedContext);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let pubkeysSet = new Set<string>();

    if (activeRelay && pendingActiveRelayUrl === activeRelay.url) {
      setExploreEvents([]);
      // console.log("ACTIVERELAY", activeRelay);
      let relayUrl = activeRelay.url.replace("wss://", "");
      let feedKey = `latest_${relayUrl}`;

      if (feed[feedKey]) {
        // console.log("Cached events from context");
        setExploreEvents(feed[feedKey]);
      } else {
        // console.log("Getting events from relay");
        let sub = activeRelay.sub([exploreFilter]);

        let events: Event[] = [];

        sub.on("event", (event: Event) => {
          // console.log("getting event", event, "from relay:", relay.url);
          // @ts-ignore
          event.relayUrl = relayUrl;
          events.push(event);
          pubkeysSet.add(event.pubkey);
        });

        sub.on("eose", () => {
          // console.log("PUBKEYS ARE:", pubkeysSet);
          // console.log("EOSE initial latest events from", activeRelay.url);
          const filteredEvents = NostrService.filterBlogEvents(events);
          const feedKey = `latest_${relayUrl}`;
          feed[feedKey] = filteredEvents;
          setFeed(feed);
          // console.log("FILTERED____EVENTS", filteredEvents);
          if (filteredEvents.length > 0) {
            setExploreEvents(filteredEvents);
          } else {
            setExploreEvents([]);
          }
          if (pubkeysSet.size > 0) {
            setpubkeys(Array.from(pubkeysSet));
          }
          sub.unsub();
        });
      }
    }

    if (activeRelay) {
      setFollowingEvents([]);
      let relayUrl = activeRelay.url.replace("wss://", "");
      let followedAuthors: string[];

      let follow_sub = activeRelay.sub([
        {
          authors: [loggedInUserKeys.publicKey],
          kinds: [3],
          limit: 50,
        },
      ]);
      follow_sub.on("event", (event: Event) => {
        followedAuthors = event.tags.map((pair: string[]) => pair[1]);
      });

      follow_sub.on("eose", () => {
        // console.log("EOSE top 50 followed users from", activeRelay.url);
        if (followedAuthors) {
          const newfollowingFilter = {
            kinds: [2222],
            limit: 50,
            authors: followedAuthors,
            until: undefined,
          };

          setFollowingFilter(newfollowingFilter);

          let followingFeedKey = `following_${relayUrl}`;
          if (feed[followingFeedKey]) {
            // console.log("Cached events from context");
            setFollowingEvents(feed[followingFeedKey]);
          } else {
            let sub = activeRelay.sub([newfollowingFilter]);
            // console.log("SUBSCRIBING TO FOLLOWING FILTER", newfollowingFilter);
            let events: Event[] = [];
            sub.on("event", (event: Event) => {
              // console.log("FOLLOWING: getting event", event, "from relay:", activeRelay.url);
              // @ts-ignore
              event.relayUrl = relayUrl;
              events.push(event);
              pubkeysSet.add(event.pubkey);
            });
            sub.on("eose", () => {
              // console.log("EOSE initial latest events from", activeRelay.url);
              const filteredEvents = NostrService.filterBlogEvents(events);
              const feedKey = `following_${relayUrl}`;
              feed[feedKey] = filteredEvents;
              setFeed(feed);

              if (pubkeysSet.size > 0) {
                // setpubkeys(...pubkeys, [Array.from(pubkeysSet)]);
                setpubkeys(Array.from(pubkeysSet));
              }

              // console.log("FILTERED____EVENTS FOLLOWING", filteredEvents);
              if (filteredEvents.length > 0) {
                setFollowingEvents(filteredEvents);
              } else {
                setExploreEvents([]);
              }
              sub.unsub();
            });
          }
        } else {
          setFollowingEvents([]);
        }
        follow_sub.unsub();
      });
    }
  }, [activeRelay]);

  return (
    <Main>
      <Content className="mt-8">
        <FollowedRelays />
        <Tabs
          className="sticky top-16 bg-white"
          TABS={TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        {activeTab === "Explore" && (
          <BlogFeed
            events={exploreEvents}
            setEvents={setExploreEvents}
            filter={exploreFilter}
            profile={true}
          />
        )}
        {activeTab === "Following" && (
          <BlogFeed
            events={followingEvents}
            setEvents={setFollowingEvents}
            filter={followingFilter}
            profile={true}
          />
        )}
      </Content>
      <Aside>
        {/* <RecommendedEvents */}
        {/*   title="Recommended Blogs" */}
        {/*   showProfile */}
        {/*   // EVENTS={ */}
        {/*   //   activeRelay && */}
        {/*   //   feed && */}
        {/*   //   feed[`latest_${activeRelay.url.replace("wss://", "")}`] && */}
        {/*   //   Array.from(feed[`latest_${activeRelay.url.replace("wss://", "")}`]) */}
        {/*   //     .sort(() => 0.5 - Math.random()) */}
        {/*   //     .slice(0, 3) */}

        {/*   //   //   [ */}
        {/*   //   //   "0d4dfa8b61c059d2f9a670f4a75c78db823fe48bb9999781bc9c204c46790019", */}
        {/*   //   //   "112f5761e3206b90fc2a5d35b0dd8a667be2ce62721e565f6b1285205d5a8e27", */}
        {/*   //   //   "f09bb957509a5bcf902e3aa0d8ba6dacfb365595ddcc9a28bc895f0b93be4f79", */}
        {/*   //   // ] */}
        {/*   // } */}
        {/* /> */}
        <Topics
          title="Recommended Topics"
          TOPICS={[
            "nostr",
            "lightning",
            "bitcoin",
            "taproot",
            "tailwindcss",
            "chess",
          ]}
        />
      </Aside>
    </Main>
  );
}
