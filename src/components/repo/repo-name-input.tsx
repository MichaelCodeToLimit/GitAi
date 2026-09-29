import { useState } from "react";
import { toRepoName } from "@/lib/validation";

/**
 * A repository name field that accepts anything and shows the name it will become,
 * e.g. "My cool app!" -> "My-cool-app". The form action applies the same conversion.
 */
export function RepoNameInput({
  defaultValue = "",
  autoFocus,
  error,
  verb = "created",
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  error?: string;
  verb?: "created" | "renamed";
}) {
  const [value, setValue] = useState(defaultValue);
  const name = toRepoName(value);
  const changed = value.trim() !== "" && name !== value.trim();

  return (
    <div className="space-y-1.5">
      <label htmlFor="name" className="block text-sm font-semibold">
        Repository name
      </label>
      <input
        id="name"
        name="name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        maxLength={200}
        className="input"
        autoFocus={autoFocus}
        autoComplete="off"
        aria-describedby="name-note"
      />
      <p id="name-note" className={`text-xs ${error ? "text-danger" : "text-fg-muted"}`} role={error ? "alert" : undefined}>
        {error ??
          (changed && name ? (
            <>
              Your repository will be {verb} as <strong className="font-semibold text-fg">{name}</strong>.
            </>
          ) : changed ? (
            "Use at least one letter or number."
          ) : (
            "Short and memorable works best, like hello-world or my-cli."
          ))}
      </p>
    </div>
  );
}
