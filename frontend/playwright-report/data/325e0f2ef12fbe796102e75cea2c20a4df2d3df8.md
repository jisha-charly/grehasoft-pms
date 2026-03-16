# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - generic [ref=e8]: 
    - heading "Welcome Back" [level=3] [ref=e9]
    - paragraph [ref=e10]: Sign in to access Grehasoft PMS
  - generic [ref=e11]:
    - generic [ref=e12]:
      - generic [ref=e13]: Username
      - generic [ref=e14]:
        - generic [ref=e16]: 
        - textbox "e.g. alex_admin" [ref=e17]
    - generic [ref=e18]:
      - generic [ref=e19]: Password
      - generic [ref=e20]:
        - generic [ref=e22]: 
        - textbox "••••••••" [ref=e23]
    - generic [ref=e24]:
      - generic [ref=e25]: Access Tier (Simulation)
      - combobox [ref=e26]:
        - option "SUPER ADMIN" [selected]
        - option "PROJECT MANAGER"
        - option "TEAM MEMBER"
        - option "SALES MANAGER"
        - option "SALES EXECUTIVE"
        - option "CLIENT"
    - button "Authenticate" [ref=e27] [cursor=pointer]
  - button "Forgot password?" [ref=e29] [cursor=pointer]
```