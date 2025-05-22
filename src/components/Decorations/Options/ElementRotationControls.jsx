import React from 'react';
import { useCakeContext } from '../../../context/CakeContext';

const ElementRotationControls = ({ elementIndex }) => {
  const { dispatch } = useCakeContext();

  const updateRotation = (axis, value) => {
    dispatch({
      type: "UPDATE_ELEMENT_ROTATION",
      index: elementIndex,
      rotation: axis === 'x' ? [value, 0, 0] : 
               axis === 'y' ? [0, value, 0] : [0, 0, value]
    });
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Rotation</h4>
      <div className="grid grid-cols-3 gap-2">
        <button 
          onClick={() => updateRotation('x', Math.PI/2)}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          90° X
        </button>
        <button 
          onClick={() => updateRotation('y', Math.PI/2)}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          90° Y
        </button>
        <button 
          onClick={() => updateRotation('z', Math.PI/2)}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          90° Z
        </button>
        <button 
          onClick={() => updateRotation('x', -Math.PI/4)}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          -45° X
        </button>
        <button 
          onClick={() => updateRotation('y', -Math.PI/4)}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          -45° Y
        </button>
        <button 
          onClick={() => updateRotation('z', -Math.PI/4)}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          -45° Z
        </button>
      </div>
    </div>
  );
};

export default ElementRotationControls;