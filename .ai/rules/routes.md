---
paths:
  - routes/ustadz.php
---

# Routes

## Ustadz route group convention
All ustadz routes live in routes/ustadz.php, grouped under middleware(['auth','verified','role:ustadz']) with prefix('ustadz') and name('ustadz.'). Resolve the profile as $request->user()->ustadz and abort(403) when missing. Add new ustadz endpoint files here.
