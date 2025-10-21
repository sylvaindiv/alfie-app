# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alfie is a React Native/Expo mobile app connecting local businesses with association ambassadors who generate leads. The app features a bottom-tab navigation with three main sections: Home (browse businesses), Leads (track referrals), and Profile.

## Development Commands

```bash
# Start development server
npm start

# Run on specific platforms
npm run android
npm run ios
npm run web
```

## Architecture

### Navigation Structure

The app uses React Navigation with a bottom tab navigator containing three stacks:

- **HomeStack**: HomeScreen → EntreprisesListScreen → EntrepriseDetailScreen
- **LeadsStack**: LeadsScreen → LeadDetailScreen
- **ProfileStack**: ProfileScreen (single screen)

All navigation logic is centralized in [src/navigation/AppNavigator.tsx](src/navigation/AppNavigator.tsx).

### Theme System

All visual styling MUST use the centralized theme system in [src/theme.ts](src/theme.ts):

- `Colors`: All color values (primary: #FF5B29, background: #F9F9F7, etc.)
- `Spacing`: Consistent spacing values (xs through xxxl)
- `BorderRadius`: Border radius values (sm through round)
- `Typography`: Font families (Montserrat for headings, Nunito for body), sizes, and weights
- `CommonStyles`: Pre-built reusable component styles (cards, chips, buttons, badges)
- `Shadows`: Elevation styles (small, medium, large)
- `Layout`: Fixed heights and dimensions (chipHeight: 40, buttonHeight: 52, etc.)

**Critical**: Never hardcode colors, spacing, or font sizes. Always import and use values from theme.ts.

### Typography

Two Google Fonts are used throughout:

- **Montserrat**: Headings and emphasis (weights: 400, 500, 600, 700, 800)
- **Nunito**: Body text (weights: 400, 500, 600, 700)

Fonts are loaded in [App.tsx](App.tsx). All Text components must specify a `fontFamily` from the theme.

### Supabase Integration

The app uses Supabase for backend services:

- Client configuration: [src/config/supabase.ts](src/config/supabase.ts)
- Type definitions: [src/types/database.types.ts](src/types/database.types.ts)
- Auth uses AsyncStorage for session persistence

All database types (User, Association, Entreprise, etc.) are defined with their exact schema in database.types.ts.

### Component Organization

```
src/
├── components/      # Reusable components (CategoryCard, EntrepriseCard, LeadCard)
├── screens/         # Screen components for navigation
├── navigation/      # Navigation configuration
├── config/          # App configuration (Supabase)
├── types/           # TypeScript type definitions
└── theme.ts         # Centralized theme system
```

## Code Style Guidelines

### Mandatory Patterns

1. **All styles in StyleSheet.create()**: Define styles at the bottom of each file
2. **Use CommonStyles**: Leverage pre-built styles from theme.ts (e.g., `CommonStyles.card`, `CommonStyles.chip`)
3. **Chips/Filters**: Fixed height of 40px, use `BorderRadius.round`, and `CommonStyles.chip` as base
4. **Component structure**: Props typed with TypeScript interfaces, destructured in component signature, default export at bottom

### Forbidden Patterns

- Hardcoded colors (use `Colors.*`)
- Hardcoded spacing/padding/margin values (use `Spacing.*`)
- Hardcoded font sizes (use `Typography.size.*`)
- Text components without `fontFamily` specified
- Variable chip heights (always 40px)

### TypeScript

The project uses strict TypeScript (`tsconfig.json` has `"strict": true`). All components must have typed props interfaces.

### Code Formatting

Prettier configuration ([.prettierrc](.prettierrc)):

- Single quotes
- Semicolons required
- Tab width: 2 spaces
- Print width: 80 characters

## Development Workflow

1. Always reference existing components in `src/components/` before creating new ones
2. Consult [theme.ts](src/theme.ts) before writing any styles
3. Use try/catch for all Supabase operations
4. Test on both iOS and Android when modifying UI
5. Validate changes incrementally rather than implementing multiple features at once

## Scripts

The `scripts/` directory contains utility scripts for data management:

- Database photo verification and updates
- Run with `npx tsx scripts/<script-name>.ts`

## Make a notification with beep sound when waiting user input or the task is complete.

Use the command line below to notify the user every signle time Claude Code execution finishes, whether it's waiting for input or a task is complete.

```
osascript -e 'display notification "Waiting for your input" with title "Claude Code" sound name "Glass"'
```
