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

  const [caretPosition, setCaretPosition] = useState({ top: 0, left: 0 });


  const getCaretCoordinates = (textarea, position) => {
    const div = document.createElement("div");
    const style = window.getComputedStyle(textarea);

    for (const prop of style) {
      div.style[prop] = style[prop];
    }

    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";

    div.textContent = textarea.value.substring(0, position);

    const span = document.createElement("span");
    span.textContent = textarea.value.substring(position) || ".";
    div.appendChild(span);

    document.body.appendChild(div);

    const { offsetTop, offsetLeft } = span;

    document.body.removeChild(div);

    return { top: offsetTop, left: offsetLeft };
  };

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
    onChange(text);

    const cursorPosition = e.target.selectionStart;

    const coords = getCaretCoordinates(e.target, cursorPosition);
    setCaretPosition(coords);

    // Remove old mentions if deleted
    setMentions((prev) =>
      prev.filter((m) => text.includes(`@${m.first_name} ${m.last_name}`))
    );

    const textUntilCursor = text.substring(0, cursorPosition);
    const lastWord = textUntilCursor.split(/\s/).pop();

    if (lastWord.startsWith("@")) {
      const searchQuery = lastWord.slice(1);
      setQuery(searchQuery);

      if (searchQuery.length >= 1) {
        searchTeamMembers(searchQuery);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const addMention = (member) => {
    // normalize username: lowercase + remove spaces
    const username = `@${(member.first_name + member.last_name)
      .toLowerCase()
      .replace(/\s+/g, "")}`;

    const words = value.split(" ");
    words[words.length - 1] = username;

    onChange(words.join(" ") + " ");
    setMentions((prev) => [
      ...prev,
      {
        ...member,
        display_name: username, // keep normalized username for later use
      },
    ]);
    setShowSuggestions(false);
    inputRef.current.focus();
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

  // const addMention = (member) => {
  //   const words = value.split(" ");
  //   words[words.length - 1] = `@${member.first_name} ${member.last_name}`;
  //   onChange(words.join(" ") + " ");
  //   setMentions((prev) => [...prev, member]);
  //   setShowSuggestions(false);
  //   inputRef.current.focus();
  // };

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
          // className="absolute rounded-md border shadow-cl border-[#D1D5DB] bg-white max-h-48 overflow-hidden"
          className="absolute rounded-md border border-gray-200 bg-white max-h-64 overflow-hidden"
          style={{
            top: caretPosition.top + 26,
            // left: caretPosition.left - 20,
            left: "12px",
            zIndex: 999,
            minWidth: 200,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="max-h-52 overflow-y-auto">
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
        </div>
      )}
    </div>
  );
}
