---
description: Workflow to investigate and fix a broken application flow (Mobile & Web)
---

1. **Identify the Flow and Issue**
   - Clearly define which user journey is broken (e.g., "Login", "Add Task", "Checkout").
   - Describe the expected behavior vs. actual behavior.

2. **Locate Relevant Code**
   - Use `find_by_name` or `grep_search` to find components associated with the flow.
   - Look for event handlers (onClick, onPress) and API calls.
   - Use `view_file_outline` to understand the structure of key files.

3. **Reproduce the Issue**
   - **Web**: Use the `browsing_agent` to navigate through the flow.
   - **Mobile**:
     - Launch the app on an Android Emulator or physical device.
     - Verify if the issue is reproducible on mobile specifically (check permissions, gestures, native UI interactions).
   - **Backend**: Check logs or use curl/scripts to hit the API directly.
   - Confirm the failure mode (crash, error message, silent failure).

4. **Debug and Analyze**
   - **General**: Add logging to variable states if not clear.
   - **Web**: Check browser console errors and network tab.
   - **Mobile**:
     - Check Metro Bundler logs for JS errors.
     - Use `adb logcat` to check native Android logs/crashes.
     - Verify native plugin status if using Capacitor/Cordova.
   - Read specific file contents using `view_file`.

5. **Implement Fix**
   - Create a plan if complex.
   - Use `replace_file_content` or `multi_replace_file_content` to apply fixes.
   - **Mobile Specific**: If adding native dependencies, remember to rebuild the android folder (`npx cap sync`, `cd android && ./gradlew build`, or similar).
   - **Important**: If modifying CSS/UI, follow the user's "CSS & UI Safety Rules" (check `overflow`, `position`, `height`, etc.).

6. **Verify the Fix**
   - Re-run the reproduction steps.
   - Ensure no regressions were introduced.
   - If a specific test case was created, enable/run it.
