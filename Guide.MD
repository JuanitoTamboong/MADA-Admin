# MADA Admin Prototype Guide

This guide follows the navigation and dashboard shown in the MADA admin prototype image. The admin's main purpose is to support farmers: maintain their records, review problems and requests, share useful information, and plan services.

## Recommended navigation

Keep the prototype's current sidebar:

1. **Dashboard**
2. **Farmers**
3. **Reports**
4. **Crops & Production**
5. **Weather & Alerts**
6. **Farmers Map**
7. **Analytics**
8. **Announcements**
9. **Settings**

For a first version, focus on **Farmers**, **Farmers Map**, **Reports**, **Crops & Production**, and **Announcements**. **Farmers** is the searchable directory; **Farmers Map** gives an authorized geographic view of registered farmers. Staff account controls are separate from farmer records and can be restricted under **Settings**.

## What to put in each page

### Dashboard

Use the dashboard as a quick overview of work needing attention.

- Summary cards: total registered farmers, reports needing review, and total farms.
- **Recent Farmers:** show a short list with name or ID, location/barangay, farm size, status, and a **View** action.
- **Recent Reports:** show report title/type, farm or barangay, submitted date, and status. Highlight items needing review.
- **Weather & Alerts:** show location, current advisory, source, and any action farmers should take.
- **Quick Insights:** summarize key numbers without duplicating every Analytics chart.
- **Recent Announcements:** show current farmer-facing notices and dates.
- Use accurate counts from stored data. Mark mock values and example farmer names as demo data.

### Farmers

Make this the main directory for individual farmers.

- Search by farmer name or ID. Filter by barangay, crop, and registration status.
- List farmer ID, name, barangay, contact status, main crop, number of farms, and registration status.
- A farmer profile should link together contact information, registered farms, crops, assistance history, and submitted reports.
- Provide **View Profile** and **Edit Record**. Add **Register Farmer** if admin staff will register farmers.
- Offer **List** and **Map** views within this page. Use approximate or barangay-level map locations unless exact farm coordinates are necessary and access-restricted.
- Keep personal and precise location information visible only to authorized staff.

### Reports

Use this page for issues submitted by farmers that need staff review and follow-up. The dashboard's **Total Reports** and **Recent Reports** should link here.

- Include reports such as pest/disease symptoms, water shortage, soil erosion, or other farm problems.
- Show report ID, farmer, farm, barangay, report type, date, priority, and status.
- Provide filters for report type, barangay, date, crop, and status.
- Suggested statuses: **New**, **Under Review**, **Field Visit Needed**, **Advice Sent**, **Resolved**, and **Closed**.
- In report details, show the farmer's description, affected crop, photos if supplied, reviewer/assigned staff, notes, and follow-up history.
- Allow staff to assign a report, record an action, update its status, and contact the farmer through an approved channel.
- Treat a pest/disease AI result as a suggestion, not a confirmed diagnosis. A qualified person should review it before recommending treatment or issuing a public warning.
- Link a report to its farmer and farm record. Group similar reports by location/crop to help staff notice possible wider problems.

### Crops & Production

Use this page to understand what farmers grow and how their farms are progressing. Put detailed crop and harvest records here; keep farmer-submitted problem reports in **Reports**, with links between the records.

- Show farmer, farm, barangay, crop, variety, planted area, planting date, expected harvest, season, and status.
- Filter by crop, season, barangay, and status (for example, Growing, Ready to Harvest, or Harvested).
- Record harvest quantity with a unit and reporting date. Identify values as farmer-reported, estimated, or verified.
- Link every crop record to the farmer and farm. Link related pest/disease reports to the crop record.
- Provide **View Details** and **Update Record** actions for authorized staff.

### Weather & Alerts

Use this page to monitor relevant conditions and share timely guidance.

- Show alert/forecast type, covered locations, severity, issue and expiry times, and data source.
- Examples include heavy rain, flooding, drought, or a verified crop-risk advisory.
- Use statuses such as **Draft**, **Active**, **Expired**, and **Acknowledged**.
- Allow authorized staff to review and publish notices; clearly distinguish official source data from staff-entered notes.
- Do not present an unverified forecast or suspected pest outbreak as confirmed information.

### Farmers Map

Use this page to view registered farmers geographically. Each map marker should correspond to a registered farmer or their registered farm location, and should link back to that farmer's record.

- Show all registered farmers with available, verified location data. Make clear when a farmer has no location on record rather than placing a made-up marker.
- Include search by farmer name or ID and filters for barangay, crop, and registration status.
- Cluster nearby markers and show counts by barangay so the map remains readable in dense areas.
- Selecting a marker should show a limited summary—farmer name or ID, barangay, main crop, farm count, and registration status—with a **View Profile** action.
- Provide a synchronized list view for accessibility and for records that do not have map coordinates.
- Restrict access to the map and personal details to authorized staff. Use approximate or barangay-level locations unless precise farm coordinates are necessary and appropriately protected; do not expose a farmer's home location publicly.
- Keep staff roles and account controls separate from this page. If needed, place a restricted **User Management** function under **Settings** and enable it only after secure authentication is implemented.

### Analytics

Use this page for visual summaries that help the agriculture office plan support.

- Useful measures include farmers by barangay, farms by crop, planted area, reported production, and reports by type/status.
- Add filters such as season/date range, barangay, and crop.
- Label chart units, data source, and last-updated date.
- Distinguish reported, estimated, and verified values. Show “No data” when there is no real information instead of filling in made-up figures.
- Keep Analytics for visual trends; use **Reports** to review and follow up on individual farmer-submitted issues.

### Announcements

Use this page to share information farmers need to act on.

- Show title, category, target audience/location, publish date, expiry date, and status.
- Useful categories include Assistance, Training, Distribution Schedule, Weather Advisory, and General.
- Include clear instructions, dates, location, eligibility, deadline, and office contact where relevant.
- Provide **Create**, **Preview**, **Publish**, **Edit**, and **Archive** actions.
- Do not include private farmer details in a public or general announcement.

### Settings

Keep this page for the signed-in administrator's own settings and general system preferences.

- Admin profile, sign out, and security options provided by a real authentication service.
- Notification preferences and office contact details if needed.
- Restrict system-wide or destructive changes and ask for confirmation.
- Keep any staff role/account controls separate from farmer map and directory records, and restrict them to authorized admins.

## Suggested admin workflow

1. Check the Dashboard for new farmers, reports needing review, and active weather alerts.
2. Open **Farmers** to verify the farmer and relevant farm information.
3. Review a submitted issue in **Reports**; assign follow-up, record the action, and update its status.
4. Check **Crops & Production** for related crop details.
5. Publish an **Announcement** or **Weather & Alerts** notice if other farmers need to know.
6. Use **Farmers Map** to understand where registered farmers are located, then use **Analytics** to identify recurring needs and plan services.

## Prototype build priorities

**First:** Farmer directory/profile; farmer report review and status updates; crop/farm records; announcements. These directly help staff respond to farmers.

**Next:** Weather alerts, Farmers Map with verified locations and clustering, and basic Analytics based on saved records.

**Later:** Live map coordinates, automated forecast feeds, report exports, advanced charts, and staff account management. These require reliable data, a secure backend, and appropriate permissions.

## Current system limitations

The current repository contains a farmer-facing front-end prototype and a visual admin prototype, not a working admin data system. Farmer/farm details and dashboard counts shown in the image are sample values. The farmer login does not verify credentials, and there is no backend or persistent database connecting farmer registrations, reports, requests, or crop records to admin pages. Treat displayed names, contact details, counts, locations, and report statuses as examples—not verified records. Use fictional sample data until secure authentication, authorization, and shared data storage are implemented.
