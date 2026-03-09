// Thin wrapper around themeStore so existing code using useTheme() still works.
import useThemeStore from "../store/themeStore";

const useTheme = () => {
  const { isDark, toggleTheme } = useThemeStore();
  return { isDark, toggleTheme };
};

export default useTheme;
