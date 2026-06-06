import '../styles/Sidebar.css';

// Renders the side navigation links and controls which tab is currently active
const Sidebar = ({ role, activeTab, setActiveTab, menuItems, isOpen, isCollapsed }) => {
  return (
    <div className={`sidebar role-${role} ${isOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          {!isCollapsed && <span className="sidebar-brand-title">Campus Connect</span>}
        </div>
      </div>
      <div className="sidebar-menu">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : ''}
          >
            <span className="sidebar-link-content">
              {item.icon && <span className="sidebar-link-icon">{item.icon}</span>}
              <span className="sidebar-link-label">{item.label}</span>
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="sidebar-unread-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </div>
      {!isCollapsed && (
        <div className="sidebar-footer">
          <p>Developed by <strong>PEDDI RAYUDU</strong></p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

