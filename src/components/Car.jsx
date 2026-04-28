import * as THREE from 'three';
import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

function Car(props) {
  const { nodes, materials } = useGLTF("/models/car.glb");

  useEffect(() => {
    Object.entries(materials).map((material) => {
      // Apply the selected color to all materials that are likely the car body
      // This is a broad brush approach since we don't know the exact material names
      material[1].color = new THREE.Color(props.item.color[0]);
      material[1].needsUpdate = true;
    });
  }, [materials, props.item]);
  
  return (
    <group {...props} dispose={null}>
      {Object.keys(nodes).map((key) => {
        const node = nodes[key];
        if (node.type === 'Mesh') {
          return (
            <mesh
              key={key}
              castShadow
              receiveShadow
              geometry={node.geometry}
              material={materials[node.material.name]}
            />
          );
        }
        return null;
      })}
    </group>
  );
}

export default Car;

useGLTF.preload("/models/car.glb");
