package com.antigravity.meatguideoverlay.ui.overlay

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.antigravity.meatguideoverlay.R
import com.antigravity.meatguideoverlay.data.model.PorkItem
import com.antigravity.meatguideoverlay.databinding.ItemPorkCutBinding

class PorkCutsAdapter(
    private var items: List<PorkItem>,
    private val onItemClick: (PorkItem) -> Unit
) : RecyclerView.Adapter<PorkCutsAdapter.ViewHolder>() {

    fun updateItems(newItems: List<PorkItem>) {
        this.items = newItems.filter { it.visible }.sortedBy { it.order }
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemPorkCutBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class ViewHolder(private val binding: ItemPorkCutBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: PorkItem) {
            binding.tvCutName.text = item.name
            binding.tvCutPosition.text = item.cutPosition
            binding.tvCutShortDesc.text = item.taste.ifBlank { item.description }

            // Set diagram icon based on ID or name
            val iconRes = when {
                item.name.contains("목살") || item.id.contains("neck") -> R.drawable.pig_diagram_neck
                item.name.contains("항정") || item.id.contains("hangjeong") -> R.drawable.pig_diagram_hangjeong
                item.name.contains("갈매기") || item.id.contains("galmaegi") -> R.drawable.pig_diagram_galmaegi
                item.name.contains("가브리") || item.id.contains("gabri") -> R.drawable.pig_diagram_gabri
                item.name.contains("삼겹") || item.id.contains("belly") || item.id.contains("samgyeop") -> R.drawable.pig_diagram_belly
                item.name.contains("송이") || item.id.contains("songi") -> R.drawable.pig_diagram_songi
                else -> R.drawable.pig_diagram_neck
            }
            binding.ivCutIcon.setImageResource(iconRes)

            binding.root.setOnClickListener {
                onItemClick(item)
            }
        }
    }
}
