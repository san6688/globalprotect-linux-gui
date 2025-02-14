import { useState, useEffect, useRef } from 'react';
import { Button } from 'antd';
import { Flex, Layout } from 'antd';
import { Input, Form } from 'antd';

const { Header, Sider, Content } = Layout;
const headerStyle = {
  textAlign: 'center',
  color: '#fff',
  justifyAlign: 'center',
  height: 100
};
const contentStyle = {
  overflow: 'auto',
};
const siderStyle = {
  paddingTop: 20,
  textAlign: 'center',
  lineHeight: '120px',
};
const layoutStyle = {
  borderRadius: 8,
  overflow: 'hidden',
  width: 'calc(100% - 8px)',
  maxWidth: 'calc(100% - 8px)',
};

function App() {

  const [logs, setLogs] = useState([]);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('CONNECT');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);


  useEffect(() => {
    window.electronAPI.onVPNLog((log) => {
      setLogs((prevLogs) => [...prevLogs, log]);
    });

    window.electronAPI.onMFARequest(() => {
      setMfaRequired(true);
    });

    window.electronAPI.onVPNConnected(() => {
      setConnectionStatus('DISCONNECT');
    });

    window.electronAPI.onVPNDisconnected(() => {
      setConnectionStatus('CONNECT');
      setLogs([]);
    });
  }, []);

  const startVPN = (server, username, password, sudopwd) => {
    setLogs([]);
    setConnectionStatus('CONNECTING')
    window.electronAPI.startVPN({ server, username, password, sudopwd });
  };

  const endVPN = () => {
    window.electronAPI.endVPN();
  };

  const sendMFA = ({ mfaCode }) => {
    window.electronAPI.sendMFA(mfaCode);
    setMfaRequired(false);
  };

  const onFinish = (values) => {
    console.log('Success:', values);
    if (connectionStatus === 'CONNECT') {
      startVPN(values.server, values.username, values.password, values.sysPassword);
    } else {
      endVPN()
    }

  }

  return (
    // use antd components to have fixed form and scrollable logs

    // Add the form fields and button to start the VPN connection
    // Add a conditional input field for the MFA code if required
    // Add a button to submit the MFA code
    // Display the logs in a scrollable div
    // Use the logs state to display the logs
    // Add a button to start the VPN connection
    <Flex style={{ height: '100vh', width: '100vw' }} justify="center" align="middle">
      <Layout style={layoutStyle}>
        <Header style={headerStyle}>
          <h2>GlobalProtect VPN</h2>
        </Header>
        <Layout>

          <Sider width={logs.length > 0 ? '40%' : '100%'} style={siderStyle}>
            <Form
              name="basic"
              style={{
                maxWidth: '70%',
                margin: 'auto',
              }}
              onFinish={onFinish}

              autoComplete="off"
            >
              <Form.Item
                name="server"
                rules={[
                  {
                    required: true,
                    message: 'Please input your server!',
                  },
                ]}
              >
                <Input placeholder='Server' />
              </Form.Item>
              <Form.Item
                name="username"
                rules={[
                  {
                    required: true,
                    message: 'Please input your username!',
                  },
                ]}
              >
                <Input placeholder='Username' />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  {
                    required: true,
                    message: 'Please input your password!',
                  },
                ]}
              >
                <Input.Password placeholder='Password' />
              </Form.Item>

              <Button block type="primary" htmlType="submit" loading={connectionStatus === 'CONNECTING'}>
                {connectionStatus}
              </Button>
            </Form>
            {
              mfaRequired && (
                <Form
                  name="mfa"
                  style={{
                    maxWidth: '50%',
                    marginBlock: 30,
                    marginInline: 'auto',
                  }}
                  onFinish={sendMFA}
                >
                  <Form.Item
                    name="mfaCode"
                    rules={[
                      {
                        required: true,
                        message: 'Please input your MFA code!',
                      },
                    ]}
                  >
                    <Input placeholder='MFA Code' />
                  </Form.Item>
                  <Button block type="primary" htmlType="submit">
                    Send MFA
                  </Button>
                </Form>
              )
            }
          </Sider>
          {logs.length > 0 &&
            <Content style={contentStyle}>
              <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
                {logs.map((log, index) => (
                  <p key={index}>{log}</p>
                ))}
                <div ref={scrollRef} />
              </div>
            </Content>
          }
        </Layout>

      </Layout>
    </Flex>

  );
}

export default App;
