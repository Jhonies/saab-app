import InventoryGrid from '../components/Inventory/InventoryGrid'
import styles from './Inventory.module.css'

const Inventory = () => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Estoque</h1>
        </div>
      </div>
      <InventoryGrid />
    </div>
  )
}

export default Inventory
