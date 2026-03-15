// Crew process management
export const CREW_SPAWN = 'crew:spawn';
export const CREW_KILL = 'crew:kill';
export const CREW_KILL_ALL = 'crew:kill-all';
export const CREW_SEND_INPUT = 'crew:send-input';
export const CREW_OUTPUT = 'crew:output';
export const CREW_STATUS = 'crew:status';

// Project management
export const PROJECT_CREATE = 'project:create';
export const PROJECT_LIST = 'project:list';
export const PROJECT_SELECT = 'project:select';
export const PROJECT_GIT_CONNECT = 'project:git-connect';

// Feature tree
export const FEATURE_CREATE = 'feature:create';
export const FEATURE_READ = 'feature:read';
export const FEATURE_UPDATE = 'feature:update';
export const FEATURE_DELETE = 'feature:delete';
export const FEATURE_LOAD_TREE = 'feature:load-tree';

// Shared memory
export const MEMORY_READ = 'memory:read';
export const MEMORY_WRITE = 'memory:write';

// Planning documents
export const PLANNING_UPLOAD = 'planning:upload';
export const PLANNING_CREATE = 'planning:create';
export const PLANNING_LIST = 'planning:list';
export const PLANNING_DELETE = 'planning:delete';

// Gamification
export const GAMIFICATION_GET_STATE = 'gamification:get-state';
export const GAMIFICATION_RECORD_COMPLETION = 'gamification:record-completion';
export const GAMIFICATION_ROLL_BUILD_QUALITY = 'gamification:roll-build-quality';

// Onboarding
export const ONBOARDING_GET_PROGRESS = 'onboarding:get-progress';
export const ONBOARDING_STEP_COMPLETE = 'onboarding:step-complete';
export const ONBOARDING_SKIP = 'onboarding:skip';
export const ONBOARDING_DETECT_FIRST_RUN = 'onboarding:detect-first-run';

// Nerve map
export const NERVE_MAP_SCAN = 'nerve-map:scan';

// Knowledge / language adaptation
export const KNOWLEDGE_GET_PROFILE = 'knowledge:get-profile';
export const KNOWLEDGE_UPDATE_LEVEL = 'knowledge:update-level';
export const KNOWLEDGE_ADAPT_TEXT = 'knowledge:adapt-text';

// Linear integration
export const LINEAR_SYNC = 'linear:sync';
export const LINEAR_CREATE_ISSUE = 'linear:create-issue';
export const LINEAR_LIST_ISSUES = 'linear:list-issues';
export const LINEAR_UPDATE_STATUS = 'linear:update-status';
export const LINEAR_POST_COMMENT = 'linear:post-comment';
