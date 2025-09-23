import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { createAPIEndPoint } from '../config/api/api';
import { getUserData } from '../utils';
import { createAPIEndPointAuth } from '../config/api/apiAuth';

const UserProfileContext = createContext();

export const UserProfileProvider = ({ children }) => {
  const userData = getUserData();
  const userId = userData?.id ?? null;

  const [user, setUser] = useState({});

  // Memoized function to fetch user data
  const getUser = useCallback(async () => {
    try {
      if (userId) {
        const response = await createAPIEndPointAuth('user/').fetchById(
          `${userId}`,
        );
        localStorage.setItem('user_role', response.data?.user_role);
        // console.log("getUser ~ sssss:", response.data?)
        setUser(response.data || {});
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      getUser();
    }
  }, [userId, getUser]);

  return (
    <UserProfileContext.Provider value={{ user, getUser }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  return useContext(UserProfileContext);
};
