import React, { useRef, useEffect, useState, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Describe the issue or task in detail...",
  minRows = 5,
  error = false,
  helperText = "",
  disabled = false,
}) {
  const quillRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  // Keep internal HTML value separate from external plain-text value
  const [htmlValue, setHtmlValue] = useState(value);

  const modules = useMemo(
    () => ({
      toolbar: [["bold", "italic"], [{ list: "bullet" }], ["clean"]],
      clipboard: { matchVisual: false },
    }),
    []
  );

  const formats = ["bold", "italic", "list", "bullet"];

  // Handle content changes — send HTML content for rich text
  const handleChange = (content, delta, source, editor) => {
    setHtmlValue(content);
    const plainText = editor.getText().trim();
    setWordCount(plainText ? plainText.split(/\s+/).length : 0);
    // Send HTML content instead of plain text
    if (onChange) onChange(content);
  };

  const borderColor = error ? "#EF4444" : isFocused ? "#824EF2" : "#E2E8F0";
  const shadowFocus = isFocused
    ? "0 0 0 3px rgba(130,78,242,0.15)"
    : error
    ? "0 0 0 3px rgba(239,68,68,0.1)"
    : "none";

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

    .rte-wrapper {
      font-family: 'DM Sans', sans-serif;
    }

    /* ── Toolbar ── */
    .rte-wrapper .ql-toolbar.ql-snow {
      border: 1.5px solid ${borderColor} !important;
      border-bottom: none !important;
      border-radius: 12px 12px 0 0 !important;
      background: linear-gradient(180deg, #FAFBFF 0%, #F4F6FE 100%) !important;
      padding: 8px 12px !important;
      transition: border-color 0.2s, box-shadow 0.2s !important;
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .rte-wrapper .ql-toolbar .ql-formats {
      margin-right: 6px !important;
      display: flex;
      align-items: center;
    }

    /* Toolbar icon color */
    .rte-wrapper .ql-toolbar .ql-stroke { stroke: #64748B !important; }
    .rte-wrapper .ql-toolbar .ql-fill  { fill:   #64748B !important; }

    /* Toolbar button base */
    .rte-wrapper .ql-toolbar button {
      width: 30px !important;
      height: 30px !important;
      border-radius: 7px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: background 0.15s, transform 0.1s !important;
      border: none !important;
    }

    .rte-wrapper .ql-toolbar button:hover {
      background: rgba(130,78,242,0.1) !important;
      transform: translateY(-1px) !important;
    }

    .rte-wrapper .ql-toolbar button.ql-active {
      background: #824EF2 !important;
    }
    .rte-wrapper .ql-toolbar button.ql-active .ql-stroke { stroke: #fff !important; }
    .rte-wrapper .ql-toolbar button.ql-active .ql-fill  { fill:   #fff !important; }

    /* ── Container / Editor ── */
    .rte-wrapper .ql-container.ql-snow {
      border: 1.5px solid ${borderColor} !important;
      border-top: none !important;
      border-radius: 0 0 12px 12px !important;
      background: ${disabled ? "#F8FAFC" : "#FFFFFF"} !important;
      min-height: ${minRows * 1.65 * 16}px !important;
      transition: border-color 0.2s, box-shadow 0.2s !important;
      box-shadow: ${shadowFocus} !important;
    }

    .rte-wrapper .ql-editor {
      font-family: 'DM Sans', sans-serif !important;
      font-size: 0.9rem !important;
      line-height: 1.8 !important;
      color: ${disabled ? "#94A3B8" : "#1E293B"} !important;
      padding: 14px 18px !important;
      caret-color: #824EF2;
    }

    .rte-wrapper .ql-editor.ql-blank::before {
      color: #CBD5E1 !important;
      font-style: normal !important;
      font-size: 0.88rem !important;
      letter-spacing: 0.01em;
      pointer-events: none !important;
    }

    .rte-wrapper .ql-editor:focus { outline: none !important; }

    /* List & inline */
    .rte-wrapper .ql-editor ul { padding-left: 1.4rem !important; margin: 6px 0 !important; }
    .rte-wrapper .ql-editor li { margin: 3px 0 !important; }
    .rte-wrapper .ql-editor li::marker { color: #824EF2; }
    .rte-wrapper .ql-editor strong, .rte-wrapper .ql-editor b { font-weight: 600 !important; color: #0F172A; }
    .rte-wrapper .ql-editor em, .rte-wrapper .ql-editor i { font-style: italic !important; color: #475569; }

    /* ── Footer ── */
    .rte-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 14px;
      margin-top: -1px;
      border: 1.5px solid ${borderColor};
      border-top: 1px solid #F1F5F9;
      border-radius: 0 0 12px 12px;
      background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
      font-family: 'DM Mono', monospace;
      font-size: 0.68rem;
      color: #94A3B8;
      letter-spacing: 0.02em;
    }

    .rte-footer .rte-shortcuts span { margin-right: 10px; }
    .rte-footer .rte-shortcuts span kbd {
      background: #E2E8F0;
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 0.64rem;
      color: #64748B;
      font-family: 'DM Mono', monospace;
    }

    .rte-footer .rte-wordcount {
      background: ${wordCount > 0 ? "rgba(130,78,242,0.08)" : "transparent"};
      color: ${wordCount > 0 ? "#824EF2" : "#CBD5E1"};
      padding: 2px 8px;
      border-radius: 20px;
      font-weight: 500;
      transition: background 0.3s, color 0.3s;
    }

    @media (max-width: 768px) {
      .rte-wrapper .ql-editor { font-size: 0.82rem !important; padding: 12px !important; }
      .rte-wrapper .ql-container.ql-snow { min-height: ${minRows * 1.4 * 16}px !important; }
    }
  `;

  // Sync HTML value when external value changes (for editing)
  useEffect(() => {
    setHtmlValue(value);
  }, [value]);

  useEffect(() => {
    const id = "rte-custom-styles";
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = customStyles;
  }, [customStyles]);

  return (
    <div className="rte-wrapper" style={{ width: "100%" }}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={htmlValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        readOnly={disabled}
        preserveWhitespace
      />

      {/* Footer */}
      <div className="rte-footer">
        <div className="rte-shortcuts">
          <span><kbd>Ctrl+B</kbd> Bold</span>
          <span><kbd>Ctrl+I</kbd> Italic</span>
        </div>
        <div className="rte-wordcount">
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </div>
      </div>

      {helperText && (
        <p
          style={{
            margin: "5px 0 0 4px",
            fontSize: "0.75rem",
            color: error ? "#EF4444" : "#64748B",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

export default RichTextEditor;