---
paths:
  - routes/muhafidz.php
---

# Routes

## Muhafidz route group convention
All muhafidz routes live in routes/muhafidz.php, grouped under middleware(['auth','verified','role:muhafidz']) with prefix('muhafidz') and name('muhafidz.'). Resolve the profile as $request->user()->muhafidz and abort(403) when missing. Add new muhafidz endpoint files here.
