// Bootstrap utilities
import * as bootstrap from 'bootstrap'

// Make Bootstrap available globally
declare global {
  interface Window {
    bootstrap: typeof bootstrap
  }
}

// Initialize Bootstrap globally
if (typeof window !== 'undefined') {
  window.bootstrap = bootstrap
}

// Export specific components
export const { Modal, Tooltip, Popover, Dropdown, Collapse } = bootstrap
export default bootstrap