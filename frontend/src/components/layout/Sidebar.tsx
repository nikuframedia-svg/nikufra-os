import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/work-centers', label: 'Máquinas', icon: '⚙️' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{
      width: 80,
      height: 913,
      left: 0,
      top: 0,
      position: 'absolute',
      overflow: 'hidden',
      background: '#2C2D30',
    }}>
      {/* Logo no topo */}
      <div style={{
        width: 50,
        height: 50,
        left: 15,
        top: 15,
        position: 'absolute',
      }}>
        <div style={{
          width: 50,
          height: 50,
          left: 0,
          top: 0,
          position: 'absolute',
          background: 'linear-gradient(225deg, #9379FF 0%, #5EC9FF 100%)',
          borderRadius: 15,
        }} />
        <div style={{
          width: 27,
          height: 22.80,
          left: 11.58,
          top: 12.81,
          position: 'absolute',
          background: '#212024',
          borderRadius: 5,
          outline: '2px #212024 solid',
          outlineOffset: '-1px',
        }} />
        <div style={{
          width: 6,
          height: 6,
          left: 23,
          top: 21,
          position: 'absolute',
          background: 'linear-gradient(225deg, #9379FF 0%, #5EC9FF 100%)',
          borderRadius: 9999,
        }} />
      </div>

      {/* Ícones de navegação */}
      {navItems.map((item, index) => {
        const isActive = location.pathname === item.path || 
                        location.pathname.startsWith(item.path);
        const topPosition = 130 + (index * 70);
        
        return (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              width: 50,
              height: 50,
              left: 15,
              top: topPosition,
              position: 'absolute',
              background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(199, 207, 214, 0.08)',
              borderRadius: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
            title={item.label}
          >
            {item.icon}
          </div>
        );
      })}
    </div>
  );
}
