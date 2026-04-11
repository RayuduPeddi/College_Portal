import '../styles/Sidebar.css';

// Renders the side navigation links and controls which tab is currently active
const Sidebar = ({ role, activeTab, setActiveTab, menuItems }) => {
  return (
    <div className={`sidebar role-${role}`}>
      <div className="sidebar-menu">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
