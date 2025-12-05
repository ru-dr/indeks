# Indeks SDK Data Parameters

> As of the latest update, **all events documented below are now being processed by the sync service and stored in the database**. The dashboard displays the most critical metrics, with additional data available via API endpoints.

## Base Event (Common to All Events)

| Parameter   | Type         | Required | Description                  |
| ----------- | ------------ | -------- | ---------------------------- |
| `type`      | `string`     | ✅       | Event type identifier        |
| `timestamp` | `number`     | ✅       | Unix timestamp               |
| `url`       | `string`     | ✅       | Current page URL             |
| `userAgent` | `string`     | ✅       | Browser user agent           |
| `sessionId` | `string`     | ✅       | Unique session identifier    |
| `userId`    | `string`     | ✅       | Unique user identifier       |
| `referrer`  | `string`     | ❌       | Referring URL                |
| `device`    | `DeviceData` | ✅       | Device & browser information |

---

## Device Data (Included in Every Event)

### Browser Info

| Parameter                     | Type     | Description                                        |
| ----------------------------- | -------- | -------------------------------------------------- |
| `device.browserName`          | `string` | Browser name (Chrome, Firefox, Safari, Edge, etc.) |
| `device.browserVersion`       | `string` | Browser version number                             |
| `device.browserEngine`        | `string` | Rendering engine (Blink, WebKit, Gecko)            |
| `device.browserEngineVersion` | `string` | Engine version                                     |

### Operating System

| Parameter          | Type     | Description                                   |
| ------------------ | -------- | --------------------------------------------- |
| `device.osName`    | `string` | OS name (Windows, macOS, iOS, Android, Linux) |
| `device.osVersion` | `string` | OS version number                             |

### Device Info

| Parameter             | Type     | Description                                |
| --------------------- | -------- | ------------------------------------------ |
| `device.deviceType`   | `string` | `mobile` \| `tablet` \| `desktop`          |
| `device.deviceVendor` | `string` | Device manufacturer (Apple, Samsung, etc.) |
| `device.deviceModel`  | `string` | Device model (iPhone, Galaxy, Pixel, etc.) |

### Screen & Display

| Parameter                 | Type     | Description                      |
| ------------------------- | -------- | -------------------------------- |
| `device.screenWidth`      | `number` | Physical screen width (px)       |
| `device.screenHeight`     | `number` | Physical screen height (px)      |
| `device.screenColorDepth` | `number` | Color depth (bits)               |
| `device.pixelRatio`       | `number` | Device pixel ratio (retina = 2+) |
| `device.viewportWidth`    | `number` | Browser viewport width (px)      |
| `device.viewportHeight`   | `number` | Browser viewport height (px)     |

### Locale & Time

| Parameter               | Type       | Description                              |
| ----------------------- | ---------- | ---------------------------------------- |
| `device.timezone`       | `string`   | IANA timezone (e.g., `America/New_York`) |
| `device.timezoneOffset` | `number`   | UTC offset in minutes                    |
| `device.language`       | `string`   | Primary browser language                 |
| `device.languages`      | `string[]` | All accepted languages                   |

### Hardware

| Parameter                    | Type             | Description                   |
| ---------------------------- | ---------------- | ----------------------------- |
| `device.deviceMemory`        | `number \| null` | RAM in GB (if available)      |
| `device.hardwareConcurrency` | `number \| null` | CPU logical cores             |
| `device.maxTouchPoints`      | `number`         | Max simultaneous touch points |
| `device.touchSupport`        | `boolean`        | Touch input supported         |

### Connection

| Parameter                        | Type             | Description                                  |
| -------------------------------- | ---------------- | -------------------------------------------- |
| `device.connectionType`          | `string \| null` | Connection type (wifi, cellular, etc.)       |
| `device.connectionEffectiveType` | `string \| null` | Effective type (`slow-2g`, `2g`, `3g`, `4g`) |
| `device.connectionDownlink`      | `number \| null` | Downlink speed (Mbps)                        |
| `device.connectionRtt`           | `number \| null` | Round-trip time (ms)                         |

### Platform & Privacy

| Parameter               | Type      | Description          |
| ----------------------- | --------- | -------------------- |
| `device.platform`       | `string`  | Platform string      |
| `device.vendor`         | `string`  | Browser vendor       |
| `device.cookiesEnabled` | `boolean` | Cookies enabled      |
| `device.doNotTrack`     | `boolean` | DNT header set       |
| `device.online`         | `boolean` | Currently online     |
| `device.isBot`          | `boolean` | Bot/crawler detected |

---

## Core Events

### Click Event

| Parameter             | Type                     | Description     |
| --------------------- | ------------------------ | --------------- |
| `element.tagName`     | `string`                 | HTML tag name   |
| `element.className`   | `string`                 | CSS classes     |
| `element.id`          | `string`                 | Element ID      |
| `element.textContent` | `string`                 | Inner text      |
| `element.attributes`  | `Record<string, string>` | All attributes  |
| `coordinates.x`       | `number`                 | Page X position |
| `coordinates.y`       | `number`                 | Page Y position |
| `coordinates.clientX` | `number`                 | Viewport X      |
| `coordinates.clientY` | `number`                 | Viewport Y      |

### Scroll Event

| Parameter          | Type     | Description             |
| ------------------ | -------- | ----------------------- |
| `scrollPosition.x` | `number` | Horizontal scroll       |
| `scrollPosition.y` | `number` | Vertical scroll         |
| `documentHeight`   | `number` | Total document height   |
| `viewportHeight`   | `number` | Visible viewport height |
| `scrollPercentage` | `number` | Scroll depth (0-100)    |

### PageView Event

| Parameter  | Type     | Description       |
| ---------- | -------- | ----------------- |
| `title`    | `string` | Page title        |
| `referrer` | `string` | Previous page URL |

### Form Submit Event

| Parameter           | Type                     | Description       |
| ------------------- | ------------------------ | ----------------- |
| `formData`          | `Record<string, string>` | Form field values |
| `formAction`        | `string`                 | Form action URL   |
| `formMethod`        | `string`                 | HTTP method       |
| `element.tagName`   | `string`                 | Form tag          |
| `element.className` | `string`                 | Form classes      |
| `element.id`        | `string`                 | Form ID           |

### Keystroke Event

| Parameter        | Type      | Description           |
| ---------------- | --------- | --------------------- |
| `key`            | `string`  | Key pressed           |
| `code`           | `string`  | Physical key code     |
| `ctrlKey`        | `boolean` | Ctrl modifier         |
| `shiftKey`       | `boolean` | Shift modifier        |
| `altKey`         | `boolean` | Alt modifier          |
| `metaKey`        | `boolean` | Meta/Cmd modifier     |
| `target.tagName` | `string`  | Target element tag    |
| `target.type`    | `string`  | Input type (optional) |
| `target.name`    | `string`  | Input name (optional) |

### Mouse Move Event

| Parameter             | Type     | Description |
| --------------------- | -------- | ----------- |
| `coordinates.x`       | `number` | Page X      |
| `coordinates.y`       | `number` | Page Y      |
| `coordinates.clientX` | `number` | Viewport X  |
| `coordinates.clientY` | `number` | Viewport Y  |

### Resize Event

| Parameter                | Type     | Description  |
| ------------------------ | -------- | ------------ |
| `dimensions.width`       | `number` | Outer width  |
| `dimensions.height`      | `number` | Outer height |
| `dimensions.innerWidth`  | `number` | Inner width  |
| `dimensions.innerHeight` | `number` | Inner height |

### Error Event

| Parameter        | Type     | Description            |
| ---------------- | -------- | ---------------------- |
| `error.message`  | `string` | Error message          |
| `error.filename` | `string` | Source file            |
| `error.lineno`   | `number` | Line number            |
| `error.colno`    | `number` | Column number          |
| `error.stack`    | `string` | Stack trace (optional) |

---

## Session Events

### Session Start Event

| Parameter            | Type      | Description                                                                     |
| -------------------- | --------- | ------------------------------------------------------------------------------- |
| `referrer`           | `string`  | Referring URL                                                                   |
| `referrerDomain`     | `string`  | Referring domain                                                                |
| `utmSource`          | `string`  | UTM source (optional)                                                           |
| `utmMedium`          | `string`  | UTM medium (optional)                                                           |
| `utmCampaign`        | `string`  | UTM campaign (optional)                                                         |
| `trafficSource`      | `string`  | `organic` \| `direct` \| `social` \| `referral` \| `paid` \| `email` \| `other` |
| `landingPage`        | `string`  | Entry page URL                                                                  |
| `isMobile`           | `boolean` | Mobile device                                                                   |
| `isTablet`           | `boolean` | Tablet device                                                                   |
| `isDesktop`          | `boolean` | Desktop device                                                                  |
| `isNewUser`          | `boolean` | First-time visitor                                                              |
| `isReturningUser`    | `boolean` | Returning visitor                                                               |
| `daysSinceLastVisit` | `number`  | Days since last visit (optional)                                                |

### Session End Event

| Parameter         | Type      | Description                                           |
| ----------------- | --------- | ----------------------------------------------------- |
| `sessionDuration` | `number`  | Total session time (ms)                               |
| `activeTime`      | `number`  | Active engagement time                                |
| `idleTime`        | `number`  | Idle time                                             |
| `pagesViewed`     | `number`  | Page count                                            |
| `totalClicks`     | `number`  | Click count                                           |
| `totalScrolls`    | `number`  | Scroll events count                                   |
| `exitPage`        | `string`  | Last page URL                                         |
| `exitType`        | `string`  | `navigation` \| `tab_close` \| `timeout` \| `refresh` |
| `converted`       | `boolean` | Conversion flag                                       |
| `bounce`          | `boolean` | Single page session                                   |

---

## Navigation Events

### Page Leave Event

| Parameter     | Type      | Description        |
| ------------- | --------- | ------------------ |
| `timeOnPage`  | `number`  | Time spent on page |
| `scrollDepth` | `number`  | Max scroll depth   |
| `clickCount`  | `number`  | Clicks on page     |
| `engaged`     | `boolean` | User engaged flag  |

### Scroll Depth Event

| Parameter     | Type     | Description                   |
| ------------- | -------- | ----------------------------- |
| `depth`       | `number` | `25` \| `50` \| `75` \| `100` |
| `timeToDepth` | `number` | Time to reach depth           |

### Before Unload Event

| Parameter    | Type     | Description        |
| ------------ | -------- | ------------------ |
| `timeOnPage` | `number` | Total time on page |

### Visibility Change Event

| Parameter         | Type      | Description           |
| ----------------- | --------- | --------------------- |
| `visibilityState` | `string`  | `visible` \| `hidden` |
| `hidden`          | `boolean` | Tab hidden state      |

### Hash Change Event

| Parameter | Type     | Description   |
| --------- | -------- | ------------- |
| `oldURL`  | `string` | Previous URL  |
| `newURL`  | `string` | New URL       |
| `oldHash` | `string` | Previous hash |
| `newHash` | `string` | New hash      |

---

## Mouse & Touch Events

### Double Click / Context Menu Event

| Parameter             | Type     | Description  |
| --------------------- | -------- | ------------ |
| `element.tagName`     | `string` | Tag name     |
| `element.className`   | `string` | Classes      |
| `element.id`          | `string` | Element ID   |
| `element.textContent` | `string` | Text content |
| `coordinates.x`       | `number` | X position   |
| `coordinates.y`       | `number` | Y position   |

### Touch Event

| Parameter              | Type     | Description         |
| ---------------------- | -------- | ------------------- |
| `touches`              | `Array`  | Touch points array  |
| `touches[].identifier` | `number` | Touch ID            |
| `touches[].clientX`    | `number` | X position          |
| `touches[].clientY`    | `number` | Y position          |
| `touches[].force`      | `number` | Pressure (optional) |
| `element.*`            | `object` | Target element info |

### Wheel Event

| Parameter       | Type     | Description             |
| --------------- | -------- | ----------------------- |
| `deltaX`        | `number` | Horizontal scroll delta |
| `deltaY`        | `number` | Vertical scroll delta   |
| `deltaZ`        | `number` | Z-axis delta            |
| `deltaMode`     | `number` | Delta unit mode         |
| `coordinates.*` | `object` | Position data           |

### Drag & Drop Event

| Parameter                    | Type       | Description     |
| ---------------------------- | ---------- | --------------- |
| `dataTransfer.dropEffect`    | `string`   | Drop effect     |
| `dataTransfer.effectAllowed` | `string`   | Allowed effects |
| `dataTransfer.types`         | `string[]` | MIME types      |
| `element.*`                  | `object`   | Element info    |
| `coordinates.*`              | `object`   | Position data   |

---

## Form Events

### Input Change Event

| Parameter         | Type     | Description           |
| ----------------- | -------- | --------------------- |
| `element.tagName` | `string` | Tag name              |
| `element.type`    | `string` | Input type            |
| `element.name`    | `string` | Field name            |
| `element.value`   | `string` | Current value         |
| `inputType`       | `string` | Input type (optional) |

### Form Abandon Event

| Parameter         | Type     | Description        |
| ----------------- | -------- | ------------------ |
| `formId`          | `string` | Form identifier    |
| `fieldsCompleted` | `number` | Completed fields   |
| `totalFields`     | `number` | Total fields       |
| `timeSpent`       | `number` | Time on form       |
| `lastField`       | `string` | Last focused field |

### Form Error Event

| Parameter      | Type     | Description                                       |
| -------------- | -------- | ------------------------------------------------- |
| `formId`       | `string` | Form identifier                                   |
| `field`        | `string` | Field name                                        |
| `errorType`    | `string` | `validation` \| `required` \| `format` \| `other` |
| `errorMessage` | `string` | Error message                                     |

### Clipboard Event

| Parameter   | Type     | Description                |
| ----------- | -------- | -------------------------- |
| `element.*` | `object` | Target element info        |
| `text`      | `string` | Copied/cut text (optional) |

### Text Selection Event

| Parameter        | Type     | Description             |
| ---------------- | -------- | ----------------------- |
| `selectedText`   | `string` | Selected text           |
| `selectionStart` | `number` | Selection start index   |
| `selectionEnd`   | `number` | Selection end index     |
| `element.*`      | `object` | Element info (optional) |

---

## Rage & Frustration Events

### Rage Click Event

| Parameter            | Type      | Description                                                           |
| -------------------- | --------- | --------------------------------------------------------------------- |
| `element`            | `string`  | CSS selector                                                          |
| `clicksInTimeframe`  | `number`  | Rapid click count                                                     |
| `timeframe`          | `number`  | Time window (seconds)                                                 |
| `whyRage`            | `string`  | `button_disabled` \| `loading` \| `no_response` \| `error` \| `other` |
| `timeOnPage`         | `number`  | Time on page                                                          |
| `userGaveUp`         | `boolean` | User abandoned action                                                 |
| `elementVisibleTime` | `number`  | Element visibility time (optional)                                    |

### Dead Click Event

| Parameter                 | Type     | Description                                              |
| ------------------------- | -------- | -------------------------------------------------------- |
| `element`                 | `string` | CSS selector                                             |
| `expectedBehavior`        | `string` | `navigate` \| `submit` \| `expand` \| `close` \| `other` |
| `actualBehavior`          | `string` | `none` \| `error` \| `redirect` \| `other`               |
| `elementVisibleTime`      | `number` | Visibility duration                                      |
| `previousClicksOnElement` | `number` | Prior clicks                                             |

### Error Click Event

| Parameter       | Type      | Description                                                       |
| --------------- | --------- | ----------------------------------------------------------------- |
| `element`       | `string`  | CSS selector                                                      |
| `errorMessage`  | `string`  | Error text                                                        |
| `errorType`     | `string`  | `validation` \| `network` \| `javascript` \| `timeout` \| `other` |
| `userContinued` | `boolean` | User continued                                                    |
| `timeToError`   | `number`  | Time until error                                                  |

---

## Search Event

| Parameter               | Type                     | Description                                                      |
| ----------------------- | ------------------------ | ---------------------------------------------------------------- |
| `query`                 | `string`                 | Search query                                                     |
| `resultsCount`          | `number`                 | Results returned                                                 |
| `searchLocation`        | `string`                 | `header` \| `sidebar` \| `page` \| `mobile` \| `other`           |
| `filtersApplied`        | `Record<string, string>` | Applied filters (optional)                                       |
| `sortBy`                | `string`                 | Sort order (optional)                                            |
| `resultsClicked`        | `number`                 | Results clicked                                                  |
| `resultPositionClicked` | `number[]`               | Positions clicked (optional)                                     |
| `timeToFirstClick`      | `number`                 | Time to first click (optional)                                   |
| `isRefinement`          | `boolean`                | Refined search                                                   |
| `previousQuery`         | `string`                 | Prior query (optional)                                           |
| `searchSource`          | `string`                 | `direct` \| `autocomplete` \| `suggestion` \| `voice` (optional) |

---

## Media Events

### Media Event

| Parameter             | Type      | Description             |
| --------------------- | --------- | ----------------------- |
| `element.tagName`     | `string`  | `video` or `audio`      |
| `element.src`         | `string`  | Media source URL        |
| `element.currentTime` | `number`  | Current playback time   |
| `element.duration`    | `number`  | Total duration          |
| `element.volume`      | `number`  | Volume level (optional) |
| `element.muted`       | `boolean` | Muted state (optional)  |

### Media Progress Event

| Parameter     | Type     | Description                   |
| ------------- | -------- | ----------------------------- |
| `progress`    | `number` | `25` \| `50` \| `75` \| `100` |
| `currentTime` | `number` | Current playback time         |
| `duration`    | `number` | Total duration                |
| `mediaUrl`    | `string` | Media source URL              |

---

## Download, Print & Share Events

### File Download Event

| Parameter                  | Type     | Description                                    |
| -------------------------- | -------- | ---------------------------------------------- |
| `fileName`                 | `string` | File name                                      |
| `fileType`                 | `string` | File extension/MIME                            |
| `fileSize`                 | `number` | Size in bytes                                  |
| `downloadSource`           | `string` | `link` \| `button` \| `auto` \| `programmatic` |
| `downloadUrl`              | `string` | Download URL (optional)                        |
| `timeOnPageBeforeDownload` | `number` | Time before download                           |
| `downloadSpeed`            | `number` | Bytes per second (optional)                    |

### Print Event

| Parameter               | Type     | Description                                        |
| ----------------------- | -------- | -------------------------------------------------- |
| `pagePrinted`           | `string` | Page URL                                           |
| `timeOnPageBeforePrint` | `number` | Time before print                                  |
| `printTrigger`          | `string` | `menu` \| `button` \| `keyboard` \| `programmatic` |
| `pagesPrinted`          | `number` | Pages printed (optional)                           |

### Share Event

| Parameter       | Type     | Description                                                                                                |
| --------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `shareMethod`   | `string` | `copy_link` \| `email` \| `facebook` \| `twitter` \| `linkedin` \| `whatsapp` \| `native_share` \| `other` |
| `contentShared` | `string` | Content identifier                                                                                         |
| `shareLocation` | `string` | `product_page` \| `article` \| `cart` \| `checkout` \| `other`                                             |
| `shareText`     | `string` | Shared text (optional)                                                                                     |
| `shareUrl`      | `string` | Shared URL (optional)                                                                                      |

---

## Performance Events

### Performance Event

| Parameter | Type     | Description                                                                                                                                                 |
| --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`    | `string` | `first_contentful_paint` \| `largest_contentful_paint` \| `first_input_delay` \| `cumulative_layout_shift` \| `time_to_interactive` \| `time_to_first_byte` |
| `value`   | `number` | Metric value                                                                                                                                                |
| `rating`  | `string` | `good` \| `needs-improvement` \| `poor` (optional)                                                                                                          |

### Page Load Event

| Parameter        | Type     | Description                     |
| ---------------- | -------- | ------------------------------- |
| `loadTime`       | `number` | Total load time (optional)      |
| `domInteractive` | `number` | DOM interactive time (optional) |
| `domComplete`    | `number` | DOM complete time (optional)    |

---

## Network Events

### Network Status Event

| Parameter        | Type      | Description                |
| ---------------- | --------- | -------------------------- |
| `isOnline`       | `boolean` | Online status              |
| `connectionType` | `string`  | Connection type (optional) |

### Network Change Event

| Parameter       | Type     | Description                                    |
| --------------- | -------- | ---------------------------------------------- |
| `effectiveType` | `string` | `slow-2g` \| `2g` \| `3g` \| `4g` \| `unknown` |
| `downlink`      | `number` | Downlink speed (optional)                      |
| `rtt`           | `number` | Round-trip time (optional)                     |

---

## Device Events

### Orientation Change Event

| Parameter     | Type     | Description               |
| ------------- | -------- | ------------------------- |
| `orientation` | `string` | `portrait` \| `landscape` |
| `angle`       | `number` | Rotation angle            |

---

## Custom Event

| Parameter    | Type                  | Description               |
| ------------ | --------------------- | ------------------------- |
| `eventName`  | `string`              | Custom event name         |
| `properties` | `Record<string, any>` | Custom properties         |
| `category`   | `string`              | Event category (optional) |
| `value`      | `number`              | Numeric value (optional)  |
| `label`      | `string`              | Event label (optional)    |

---

## Outbound Link Event

| Parameter      | Type      | Description        |
| -------------- | --------- | ------------------ |
| `url`          | `string`  | Destination URL    |
| `domain`       | `string`  | Destination domain |
| `linkText`     | `string`  | Link text          |
| `openInNewTab` | `boolean` | Opens in new tab   |

---

## Resource Error Event

| Parameter      | Type     | Description                                       |
| -------------- | -------- | ------------------------------------------------- |
| `resourceType` | `string` | `img` \| `script` \| `style` \| `font` \| `other` |
| `resourceUrl`  | `string` | Resource URL                                      |
| `errorMessage` | `string` | Error message                                     |
