# MADA Farmers System — Admin Guide

## Purpose

MADA is a farmer-facing prototype intended to bring farm information and common agriculture services into one interface. This guide describes what the current application shows so an administrator can understand its sample farmer information and avoid mistaking the demo for a live user registry.

## Farmer profile currently shown

The app displays one example farmer profile:

| Field | Current display |
|---|---|
| Name | Juanito Tamboong Jr. |
| Role | Farmer |
| Location | Odiongan, Romblon |
| Phone and email | A phone number and email address are displayed in the profile screen; verify these directly before relying on them. |

The dashboard greets the same example user as “Juanito.” This information is hard-coded in the interface. It is not loaded from a farmer account or an official registry, so it should not be treated as verified personal or contact information.

## What a farmer can see in the prototype

- **Dashboard:** Example greeting, location, weather, farm summary, quick links, and sample upcoming task.
- **My Farms:** Two example farm records (San Jose Farm and Agbaluto Farm), with locations, sizes, crops, and planting/harvest dates. The screen also has an Add Farm form.
- **Farm Details:** A sample rice-farm record with area, crop variety, dates, and farming activities.
- **Crop Health:** A sample pest/disease report and recommendations.
- **Farming Calendar:** Example farming tasks and dates.
- **Farm Finances:** Example expense and income information.
- **Market Prices:** A screen for crop and livestock prices.
- **Announcements:** Example notices for assistance, training, and other events.
- **Assistance Request:** Example assistance requests and a form for submitting another request.
- **Profile:** Example farmer contact details, links to profile-related screens, and a logout action.

## Important account and data limitations

- There is **no admin dashboard, user list, farmer search, or account-management workflow** in this version.
- The login form checks that the email and password fields are filled in, but it does not verify credentials. Submitting the form opens the farmer dashboard.
- “Continue with Google,” “Register here,” and “Forgot Password?” are not connected to real account services.
- Farmer, farm, task, announcement, finance, and request examples are defined in the front-end. Some forms update only the current screen's in-memory state.
- There is no backend or persistent database. Refreshing or reopening the app does not provide a reliable record of submitted changes.

## Recommended admin handling

1. Treat the displayed farmer, farm, and service information as **demo/example data** until checked against an authoritative source.
2. Do not use this prototype to approve assistance, confirm farmer eligibility, or maintain official contact records.
3. Verify contact details with the farmer through an approved channel; avoid sharing personal details more widely than necessary.
4. Before using MADA operationally, add a secured backend and verified sign-in, define farmer and admin roles, and create an admin workflow for reviewing and maintaining farmer records.

## Guide for the admin navigation prototype

Use the navigation to group the admin's main jobs: maintaining farmer records, monitoring production, responding to conditions and alerts, and managing the system. Each page should have a clear title, a short summary, a searchable or filterable list where useful, and one obvious primary action.

### 1. Farmers

Use this page as the main farmer directory.

- Show a searchable table or list with farmer name, farmer ID, barangay, phone, number of farms, main crop, and registration status.
- Add filters for barangay, crop, and status (for example, Active, Pending Verification, or Inactive).
- Include **View Profile** and **Edit** actions. The profile should show contact details, farm records, crops, and assistance-request history.
- Add a clear **Add Farmer** action if registration is part of the admin's responsibilities.
- Keep identity and contact details visible only to authorized staff.

### 2. Reports

Use this page for printable or downloadable summaries that staff need for planning and office reporting.

- Offer a reporting period and filters such as barangay, crop, and season.
- Include reports such as registered farmers, total farm area, crop production, and assistance distributed.
- Show when the report was generated and what filters were applied.
- Provide **View Report** and, if implemented, **Export** or **Print** actions.
- Do not label estimates as actual harvest or production figures.

### 3. Crops & Production

Use this page to track what farmers grow and the production figures they report.

- Show farmer, farm, barangay, crop, variety, planted area, planting date, expected harvest date, and production status.
- Allow filtering by crop, season, barangay, and status (for example, Growing, Ready to Harvest, or Harvested).
- Provide **View Details** and **Update Record** actions.
- If recording harvest, distinguish the reported quantity from verified quantity and include the unit (such as kilograms or sacks) and reporting date.
- Link every crop record to its farmer and farm.

### 4. Weather & Alerts

Use this page to help staff monitor conditions and share relevant warnings.

- Show the covered location, forecast or alert type, issue time, and source of the information.
- Organize alerts by location and severity, and show whether each alert is Active, Expired, or Acknowledged.
- Include practical alert topics such as heavy rain, flooding, drought, or crop-pest risks when supported by a reliable source.
- Let authorized staff publish an alert or mark it acknowledged; display a confirmation before publishing.
- Clearly label sample or manually entered forecasts. Do not present unverified weather data as an official forecast.

### 5. Farmers Map (instead of User Management)

If the admin's goal is to find and understand the geographic distribution of registered farmers, replace **User Management** in the main navigation with **Farmers Map**. This page is for authorized staff to explore farmer locations; it is not a public map.

- Show map markers for registered farmers or farms, with filters for barangay, crop, registration status, and season.
- Include a search field so staff can find a farmer by name or farmer ID, plus a list view for users who cannot easily use the map.
- When a marker is selected, show a limited summary (farmer name or ID, barangay, main crop, farm count, and registration status) and a **View Profile** action.
- Offer a barangay-level farmer count or cluster markers when many farmers are close together.
- Use verified coordinates only. If precise farm or home locations are unavailable or too sensitive, show approximate or barangay-level locations instead.
- Restrict the map and personal details to authorized staff. Do not expose exact farm/home coordinates or contact details publicly.
- Keep account roles and staff access controls in a separate **Admin Settings** area, or a restricted account-management page if needed. Do not remove secure access controls just because they are not in the main navigation.

### 6. Analytics

Use this page for a quick visual overview; keep detailed, printable outputs in Reports.

- Show a small set of useful indicators: registered farmers, active farms, total planted area, production reported, and open assistance requests.
- Add simple charts such as farmers by barangay, planted area by crop, and production by season.
- Allow filtering by period, barangay, and crop, and show the date the data was last updated.
- Explain the unit and source for each figure. Show “No data” rather than inventing values.
- Make clear whether numbers are reported, estimated, or verified.

### 7. Announcements

Use this page to draft and publish information farmers need.

- List announcement title, category, publish date, expiry date, audience, and status (Draft, Published, or Archived).
- Include categories such as Assistance, Training, Weather Advisory, and General.
- Provide **Create Announcement**, **Edit Draft**, **Publish**, and **Archive** actions.
- Include a clear message, event date and location when relevant, contact office, and any eligibility or deadline details.
- Preview an announcement before publishing and avoid including a farmer's private information.

### 8. Settings

Use this page for administrator preferences and system information.

- Include the signed-in admin's profile and password/security options provided by the authentication service.
- Add office details and notification preferences if the system needs them.
- Show application version and data-management or privacy information.
- Keep system-wide or destructive actions restricted to authorized roles and require confirmation.
- Put **Sign Out** in a consistent, easy-to-find place.

### Suggested admin work flow

1. Review **Analytics** or the **Dashboard** for current priorities.
2. Find or verify a farmer in **Farmers**, then check their linked records in **Crops & Production**.
3. Check **Weather & Alerts** and publish an announcement if farmers need to act.
4. Use **Reports** to prepare summaries for a chosen period and filters.
5. Use **Farmers Map** to explore farmer distribution and open a farmer record; use **Settings** for admin preferences and keep staff-account controls restricted.

For the prototype, use fictional/sample records and make sample status visible. The navigation describes recommended future admin features; it does not mean those features, real map coordinates, or data storage are currently implemented.

## Current system status

This repository is a front-end prototype built with React, TypeScript, and Vite. It demonstrates screens and interactions; it does not currently provide production account management or a reliable source of farmer records.
