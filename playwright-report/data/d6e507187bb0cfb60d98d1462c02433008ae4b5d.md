# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: happy-path.spec.ts >> Happy Path Flow >> should navigate to schedule and inbox after login simulation
- Location: tests\e2e\happy-path.spec.ts:110:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('sidebar-item-inbox')

```

# Page snapshot

```yaml
- generic [ref=e4]:
    - img [ref=e6]
    - heading "Something went wrong" [level=2] [ref=e8]
    - paragraph [ref=e9]: users.map is not a function
    - button "Refresh Page" [ref=e10] [cursor=pointer]:
        - img
        - text: Refresh Page
```

# Test source

```ts
  49  |         body: JSON.stringify({
  50  |           id: 'ws-1',
  51  |           name: 'Test Workspace',
  52  |           modules_active: { assistance: true, school: true },
  53  |           settings: { language: 'en' }
  54  |         })
  55  |       });
  56  |     });
  57  |
  58  |     // Mock Team Members (Unread Notes/Permissions)
  59  |     await page.route('**/rest/v1/team_members*', async (route) => {
  60  |       await route.fulfill({
  61  |         status: 200,
  62  |         contentType: 'application/json',
  63  |         body: JSON.stringify([{ team_id: 'team-1', notes_last_read_at: new Date().toISOString() }])
  64  |       });
  65  |     });
  66  |
  67  |     // Mock Teams
  68  |     await page.route('**/rest/v1/teams*', async (route) => {
  69  |       await route.fulfill({
  70  |         status: 200,
  71  |         contentType: 'application/json',
  72  |         body: JSON.stringify([{ id: 'team-1', name: 'Test Team', workspace_id: 'ws-1' }])
  73  |       });
  74  |     });
  75  |
  76  |     // Mock Messages (Unread count)
  77  |     await page.route('**/rest/v1/messages*', async (route) => {
  78  |       // If it's a HEAD request for count
  79  |       if (route.request().method() === 'HEAD') {
  80  |         await route.fulfill({
  81  |           status: 200,
  82  |           headers: { 'content-range': '0-0/0' }
  83  |         });
  84  |       } else {
  85  |         await route.fulfill({
  86  |           status: 200,
  87  |           contentType: 'application/json',
  88  |           body: JSON.stringify([])
  89  |         });
  90  |       }
  91  |     });
  92  |
  93  |     // Mock Notes
  94  |     await page.route('**/rest/v1/notes*', async (route) => {
  95  |       await route.fulfill({
  96  |         status: 200,
  97  |         contentType: 'application/json',
  98  |         body: JSON.stringify([])
  99  |       });
  100 |     });
  101 |
  102 |     // Navigate to the app
  103 |     await page.goto('/');
  104 |   });
  105 |
  106 |   test('should show login page initially', async ({ page }) => {
  107 |     await expect(page.getByTestId('yntra-logo')).toBeVisible();
  108 |   });
  109 |
  110 |   test('should navigate to schedule and inbox after login simulation', async ({ page }) => {
  111 |     // Manually set the session to bypass social login redirect
  112 |     await page.evaluate(() => {
  113 |       const session = {
  114 |         access_token: 'fake-token',
  115 |         token_type: 'bearer',
  116 |         expires_in: 3600,
  117 |         refresh_token: 'fake-refresh',
  118 |         user: {
  119 |           id: 'test-user-uuid',
  120 |           email: 'test@example.com',
  121 |           user_metadata: { role: 'admin' },
  122 |           app_metadata: { provider: 'google' },
  123 |           aud: 'authenticated',
  124 |           created_at: new Date().toISOString()
  125 |         },
  126 |         expires_at: Math.floor(Date.now() / 1000) + 3600
  127 |       };
  128 |       // We set both the common key and the project-specific key to be safe
  129 |       localStorage.setItem('sb-ileffmdueouhbooesjnv-auth-token', JSON.stringify(session));
  130 |       localStorage.setItem('supabase.auth.token', JSON.stringify(session));
  131 |     });
  132 |
  133 |     await page.reload();
  134 |
  135 |     // Give it a bit more time to process the session
  136 |     await page.waitForURL(/.*schedule/, { timeout: 10000 });
  137 |
  138 |     // Verify we are on the schedule page
  139 |     await expect(page).toHaveURL(/.*schedule/);
  140 |
  141 |     // Debug: What's on the page?
  142 |     const body = await page.innerHTML('body');
  143 |     console.log('Page Body Snapshot:', body.substring(0, 500));
  144 |
  145 |     // Check if user name is displayed in the header
  146 |     await expect(page.getByText('Test Admin')).toBeVisible();
  147 |
  148 |     // Navigate to Inbox
> 149 |     await page.getByTestId('sidebar-item-inbox').click();
      |                                                  ^ Error: locator.click: Test timeout of 30000ms exceeded.
  150 |     await expect(page).toHaveURL(/.*inbox/);
  151 |   });
  152 | });
  153 |
```
