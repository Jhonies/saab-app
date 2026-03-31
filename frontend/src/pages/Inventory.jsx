import InventoryGrid from '../components/Inventory/InventoryGrid'
import ProductPanel  from '../components/Inventory/ProductPanel'
import styles from './Inventory.module.css'

const Inventory = () => (
  <div className={styles.page}>
    <div className={styles.header}>
      <div>
        <p className={styles.eyebrow}>Módulo A</p>
        <h1 className={styles.title}>Gestão de Inventário</h1>
      </div>
    </div>
    <InventoryGrid />
    <ProductPanel />
  </div>
)

export default Inventory
