import React, { useState, useRef } from "react";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { toProperCase } from "../utils/formatting";

export default function MentionsInput({
  value,
  onChange,
  mentions,
  setMentions,
}) {
  const [teamResults, setTeamResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const searchTeamMembers = async (query) => {
    setLoading(true);
    try {
      const res = await createAPIEndPointAuth(
        `clinic_team/search?query=${query}`
      ).fetchAll();
      setTeamResults(res?.data?.results || []);
    } catch (err) {
      console.error("Failed to search team members", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const text = e.target.value;
    onChange(text); // lift state up

    // 🔹 Auto-remove mentions that are no longer in the text
    setMentions((prev) =>
      prev.filter((m) => text.includes(`@${m.first_name} ${m.last_name}`))
    );

    const lastWord = text.split(" ").pop();
    if (lastWord.startsWith("@")) {
      const searchQuery = lastWord.slice(1);
      setQuery(searchQuery);
      if (searchQuery.length > 1) {
        searchTeamMembers(searchQuery);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // const handleChange = (e) => {
  //   const text = e.target.value;
  //   onChange(text); // lift state up

  //   const lastWord = text.split(" ").pop();
  //   if (lastWord.startsWith("@")) {
  //     const searchQuery = lastWord.slice(1);
  //     setQuery(searchQuery);
  //     if (searchQuery.length > 1) {
  //       searchTeamMembers(searchQuery);
  //       setShowSuggestions(true);
  //     } else {
  //       setShowSuggestions(false);
  //     }
  //   } else {
  //     setShowSuggestions(false);
  //   }
  // };

  const addMention = (member) => {
    const words = value.split(" ");
    words[words.length - 1] = `@${member.first_name} ${member.last_name}`;
    onChange(words.join(" ") + " ");
    setMentions((prev) => [...prev, member]);
    setShowSuggestions(false);
    inputRef.current.focus();
  };

  return (
    <div className="relative w-full ">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        placeholder="Type @ to mention a team member..."
        // className="w-full rounded-md focus:!border-2 border-[#E5E7EB] focus:!border-brand-500 focus:ring-2 focus:ring-blue-500 p-3 text-sm shadow-sm resize-y outline-none"
        className="w-full rounded-md  border-none bg-transparent  p-3 text-sm resize-none"
        // rows={5}
        rows={4}
      />

      {showSuggestions && (
        <div
          className="absolute left-0 -translate-y-1 top-full mt-1 w-full rounded-md border shadow-lg border-[#D1D5DB] bg-white max-h-48 overflow-y-auto "
          style={{
            zIndex: 999,
            // boxShadow:
            //   " 0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12)",
          }}
        >
          {loading ? (
            <div className="p-2 text-sm text-gray-500">Searching...</div>
          ) : teamResults.length > 0 ? (
            teamResults.map((member) => (
              <div
                key={member.user_id}
                onClick={() => addMention(member)}
                className="cursor-pointer px-3 py-2 hover:bg-gray-50 flex flex-col"
              >
                <span className="text-sm font-medium text-gray-600 ">
                  {`${toProperCase(member.first_name)} ${toProperCase(
                    member.last_name
                  )}`}
                </span>
                <span className="text-xs text-gray-500">{member.email}</span>
              </div>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">No results</div>
          )}
        </div>
      )}
    </div>
  );
}
