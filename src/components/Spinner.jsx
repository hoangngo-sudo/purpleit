import { motion } from 'motion/react';

/**
 * A simple animated spinner that uses Motion's rotate instead of CSS @keyframes.
 * Avoids conflicts with page transition animations and reduced-motion rules.
 *
 * @param {object} props
 * @param {'sm'|'md'} [props.size='md']  sm = 1rem, md = 2rem
 * @param {string} [props.className]      Additional classes
 */
const Spinner = ({ size = 'md', className = '' }) => {
  const px = size === 'sm' ? 16 : 32;

  return (
    <motion.div
      role="status"
      className={className}
      style={{
        width: px,
        height: px,
        border: `${size === 'sm' ? 3 : 4}px solid`,
        borderRightColor: 'transparent',
        borderRadius: '50%',
        display: 'inline-block',
        willChange: 'transform',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
    >
      <span className="visually-hidden">Loading...</span>
    </motion.div>
  );
};

export default Spinner;
